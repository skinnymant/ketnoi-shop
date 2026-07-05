import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get() // GET /products?category=...&brand=...&page=...
  findAll(@Query() query: QueryProductDto) {
    return this.service.findAll(query);
  }

  @Get(':slug') // GET /products/may-khoan-pin-makita-df333dsae-12v
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post() // POST /products
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id') // PATCH /products/<uuid>
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') // DELETE /products/<uuid>  (xóa mềm)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
