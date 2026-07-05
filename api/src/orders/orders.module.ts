import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, JwtAuthGuard],
})
export class OrdersModule {}
