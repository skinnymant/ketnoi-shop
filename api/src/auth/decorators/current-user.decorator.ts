import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../jwt-payload';

// Lấy khách hàng hiện tại từ request (do JwtAuthGuard gắn vào).
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    return req.user;
  },
);
