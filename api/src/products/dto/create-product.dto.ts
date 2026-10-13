import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// Ảnh sản phẩm (nested create)
export class ProductImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

// Thông số kỹ thuật (nested create)
export class ProductSpecDto {
  @IsString()
  @MinLength(1)
  specName: string;

  @IsString()
  @MinLength(1)
  specValue: string;

  @IsOptional()
  @IsInt()
  position?: number;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string; // URL không dấu: may-khoan-pin-makita-df333dsae-12v

  @IsString()
  @MinLength(2)
  sku: string; // mã hàng nội bộ, duy nhất

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number; // giá gốc (VND, số nguyên)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salePrice?: number; // giá bán sau giảm

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  soldCount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  freeShip?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warrantyMonths?: number | null; // null = chưa xác nhận; 0 = không bảo hành

  @IsString()
  categoryId: string; // bắt buộc: sản phẩm phải thuộc 1 danh mục

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDesc?: string;

  // Mảng ảnh — validate từng phần tử
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  // Mảng thông số kỹ thuật — validate từng phần tử
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  specs?: ProductSpecDto[];
}
