import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Phiếu khai các tham số lọc trên query string.
// Query string luôn là chữ, nên cần @Type(() => Number) để ép về số.
export class QueryProductDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number = 12;

  @IsOptional() @IsString()
  category?: string; // slug danh mục (gồm cả con của nó)

  @IsOptional() @IsString()
  brand?: string; // slug thương hiệu

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxPrice?: number;

  @IsOptional() @IsString()
  search?: string; // từ khóa tìm kiếm

  @IsOptional() @IsString()
  spec?: string; // lọc thông số, dạng "Điện áp:18V"

  @IsOptional() @IsIn(['newest', 'price_asc', 'price_desc', 'best_selling'])
  sort?: string = 'newest';

  @IsOptional() @IsIn(['true', 'false'])
  onSale?: string; // "true" = chỉ sản phẩm đang giảm giá (trang Khuyến mãi)
}
