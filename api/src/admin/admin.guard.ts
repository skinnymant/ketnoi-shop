import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AdminJwtPayload {
  sub: string;
  name: string;
  typ: 'admin';
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu token quản trị');
    }
    try {
      const payload = await this.jwt.verifyAsync<AdminJwtPayload>(
        header.slice('Bearer '.length),
      );
      if (payload.typ !== 'admin') throw new Error('not admin');
      (req as Request & { admin?: AdminJwtPayload }).admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token quản trị không hợp lệ');
    }
  }
}
