import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      global: true, // JwtService dùng được ở mọi module (vd. OrdersModule)
      secret: process.env.JWT_SECRET ?? 'ketnoi_jwt_dev_secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES ?? '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
