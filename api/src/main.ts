import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Soát mọi dữ liệu gửi lên theo DTO: thiếu trường, sai kiểu → chặn từ cửa
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Cho phép frontend gọi sang backend. Domain lấy từ CORS_ORIGINS
  // (nhiều domain ngăn cách bằng dấu phẩy). Mặc định: localhost:3000.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins });

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
void bootstrap();
