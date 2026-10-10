import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import type { AdminJwtPayload } from './admin.guard';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const email = process.env.ADMIN_EMAIL ?? 'admin@ketnoi.local';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';
    if (dto.email !== email || dto.password !== password) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu quản trị');
    }
    const payload: AdminJwtPayload = {
      sub: 'admin',
      name: 'Quản trị viên',
      typ: 'admin',
    };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, admin: { name: 'Quản trị viên', email } };
  }

  // Thống kê nhanh cho dashboard
  async stats() {
    const [totalOrders, pending, revenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['CONFIRMED', 'SHIPPING', 'COMPLETED'] } },
      }),
    ]);
    return {
      totalOrders,
      pending,
      revenue: revenue._sum.total ?? 0,
    };
  }

  listOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: true,
        customer: { select: { fullName: true, phone: true, email: true } },
      },
    });
  }

  async getOrder(code: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode: code },
      include: { items: true, payments: true, customer: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  // Cập nhật trạng thái thanh toán (admin đánh dấu đã nhận tiền)
  async markPayment(code: string, status: PaymentStatus) {
    const order = await this.getOrder(code);
    await this.prisma.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    });
    return this.getOrder(code);
  }

  async updateStatus(code: string, dto: UpdateOrderStatusDto) {
    await this.getOrder(code); // ném 404 nếu không có
    return this.prisma.order.update({
      where: { orderCode: code },
      data: { status: dto.status },
    });
  }
}
