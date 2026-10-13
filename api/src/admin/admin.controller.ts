import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AdminGuard } from './admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Post('auth/login') // POST /admin/auth/login
  login(@Body() dto: AdminLoginDto) {
    return this.service.login(dto);
  }

  @Get('stats') // GET /admin/stats
  @UseGuards(AdminGuard)
  stats() {
    return this.service.stats();
  }

  @Get('orders') // GET /admin/orders
  @UseGuards(AdminGuard)
  orders() {
    return this.service.listOrders();
  }

  @Get('orders/:code') // GET /admin/orders/:code
  @UseGuards(AdminGuard)
  order(@Param('code') code: string) {
    return this.service.getOrder(code);
  }

  @Patch('orders/:code/status') // PATCH /admin/orders/:code/status
  @UseGuards(AdminGuard)
  updateStatus(
    @Param('code') code: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(code, dto);
  }

  @Patch('orders/:code/payment') // PATCH /admin/orders/:code/payment
  @UseGuards(AdminGuard)
  markPayment(@Param('code') code: string, @Body() dto: UpdatePaymentDto) {
    return this.service.markPayment(code, dto.status);
  }
}
