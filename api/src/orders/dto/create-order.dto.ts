import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class OrderItemInput {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(2)
  receiverName: string;

  @IsString()
  @MinLength(8)
  receiverPhone: string;

  @IsOptional()
  @IsEmail()
  receiverEmail?: string;

  @IsString()
  @MinLength(5)
  shippingAddress: string; // địa chỉ đầy đủ 1 dòng

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsIn(['COD', 'BANK_TRANSFER'])
  paymentMethod?: 'COD' | 'BANK_TRANSFER'; // mặc định COD

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}
