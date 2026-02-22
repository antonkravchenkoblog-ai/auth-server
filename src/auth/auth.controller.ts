import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Recaptcha()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.OK)
  public async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Recaptcha()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.authService.login(req, dto);
  }

  @Get('/oauth/connect/google')
  @UseGuards(AuthGuard('google'))
  public async connectGoogle() {
  }

  @Get('/oauth/callback/google')
  @UseGuards(AuthGuard('google'))
  public async callbackGoogle(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.handleOAuthLogin(req, req.user as any);

    return res.redirect(
      `${this.configService.getOrThrow<string>('APPLICATION_URL')}/dashboard/settings`,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(req, res);
  }
}
