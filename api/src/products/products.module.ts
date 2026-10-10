import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, AdminGuard],
})
export class ProductsModule {}
