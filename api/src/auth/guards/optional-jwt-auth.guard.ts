import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from '../jwt-payload';

// Như JwtAuthGuard nhưng KHÔNG bắt buộc: có token hợp lệ thì gắn
// request.user, không có (hoặc token hỏng) vẫn cho qua — dùng cho
// endpoint phục vụ cả khách vãng lai lẫn khách đã đăng nhập.
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length);
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token);
        (req as Request & { user?: JwtPayload }).user = payload;
      } catch {
        // token hỏng/hết hạn → coi như khách vãng lai
      }
    }
    return true;
  }
}
