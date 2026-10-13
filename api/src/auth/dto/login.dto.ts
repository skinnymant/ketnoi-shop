import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  emailOrPhone: string; // đăng nhập bằng email HOẶC số điện thoại

  @IsString()
  @MinLength(6)
  password: string;
}
