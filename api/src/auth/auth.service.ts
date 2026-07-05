import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Cần ít nhất email hoặc số điện thoại');
    }

    // Kiểm tra trùng email / SĐT
    if (dto.email) {
      const existed = await this.prisma.customer.findUnique({
        where: { email: dto.email },
      });
      if (existed) throw new BadRequestException('Email đã được đăng ký');
    }
    if (dto.phone) {
      const existed = await this.prisma.customer.findUnique({
        where: { phone: dto.phone },
      });
      if (existed)
        throw new BadRequestException('Số điện thoại đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
      },
    });

    return this.signToken(customer.id, customer.fullName, customer);
  }

  async login(dto: LoginDto) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ email: dto.emailOrPhone }, { phone: dto.emailOrPhone }],
      },
    });
    if (!customer || !customer.passwordHash) {
      throw new UnauthorizedException('Sai thông tin đăng nhập');
    }
    const ok = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!ok) throw new UnauthorizedException('Sai thông tin đăng nhập');

    return this.signToken(customer.id, customer.fullName, customer);
  }

  async me(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        membershipTier: true,
        createdAt: true,
      },
    });
    if (!customer) throw new UnauthorizedException('Tài khoản không tồn tại');
    return customer;
  }

  private async signToken(
    id: string,
    name: string,
    customer: {
      id: string;
      fullName: string;
      email: string | null;
      phone: string | null;
      membershipTier: string;
    },
  ) {
    const payload: JwtPayload = { sub: id, name };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        membershipTier: customer.membershipTier,
      },
    };
  }
}
