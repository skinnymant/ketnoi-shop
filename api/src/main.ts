import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Soát mọi dữ liệu gửi lên theo DTO: thiếu trường, sai kiểu → chặn từ cửa
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Cho phép frontend (cổng 3000) gọi sang backend (cổng 4000)
  app.enableCors({ origin: ['http://localhost:3000'] });

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
