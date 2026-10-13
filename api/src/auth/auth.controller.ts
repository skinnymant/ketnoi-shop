import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './jwt-payload';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register') // POST /auth/register
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login') // POST /auth/login
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Get('me') // GET /auth/me  (cần Bearer token)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.service.me(user.sub);
  }
}
