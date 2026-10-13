import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string; // URL không dấu: may-khoan-pin

  @IsOptional()
  @IsString()
  parentId?: string; // để trống = danh mục gốc

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDesc?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
