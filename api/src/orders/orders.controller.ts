import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  // POST /orders → đặt hàng. KHÔNG bắt buộc đăng nhập: có token thì
  // đơn gắn vào tài khoản, không có thì là đơn khách vãng lai.
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    return this.service.create(user?.sub ?? null, dto);
  }

  @Get() // GET /orders  → đơn của tôi (vẫn cần đăng nhập)
  @UseGuards(JwtAuthGuard)
  myOrders(@CurrentUser() user: JwtPayload) {
    return this.service.findMyOrders(user.sub);
  }

  @Get(':code') // GET /orders/KN20260705-1234 (vẫn cần đăng nhập)
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: JwtPayload, @Param('code') code: string) {
    return this.service.findOne(user.sub, code);
  }
}
