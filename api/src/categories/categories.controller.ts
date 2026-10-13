import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories') // mọi địa chỉ bắt đầu bằng /categories
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get() // GET /categories
  findTree() {
    return this.service.findTree();
  }

  @Get(':slug') // GET /categories/may-khoan-pin
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post() // POST /categories
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id') // PATCH /categories/<uuid>
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') // DELETE /categories/<uuid>
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
