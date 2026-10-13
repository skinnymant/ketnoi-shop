import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// Phiếu khi SỬA — mọi trường đều tùy chọn, kế thừa từ phiếu tạo.
export class UpdateProductDto extends PartialType(CreateProductDto) {}
