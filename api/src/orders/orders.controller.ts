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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload';

@Controller('orders')
@UseGuards(JwtAuthGuard) // toàn bộ endpoint đơn hàng cần đăng nhập
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post() // POST /orders  → đặt hàng
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.service.create(user.sub, dto);
  }

  @Get() // GET /orders  → đơn của tôi
  myOrders(@CurrentUser() user: JwtPayload) {
    return this.service.findMyOrders(user.sub);
  }

  @Get(':code') // GET /orders/KN20260705-1234
  findOne(@CurrentUser() user: JwtPayload, @Param('code') code: string) {
    return this.service.findOne(user.sub, code);
  }
}
