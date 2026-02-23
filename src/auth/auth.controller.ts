import {
  Body,
  ConflictException,
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
import { Authorization } from './decorators/auth.decorator';
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

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('/oauth/connect/google')
  @UseGuards(AuthGuard('google'))
  public async connectGoogle() {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('/oauth/callback/google')
  @UseGuards(AuthGuard('google'))
  public async callbackGoogle(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const applicationUrl = this.configService.getOrThrow<string>('APPLICATION_URL');

    try {
      await this.authService.handleOAuthLogin(req, req.user as any);
      return res.redirect(`${applicationUrl}/dashboard/settings`);
    } catch (error) {
      console.log(error)
      const message = encodeURIComponent(
        error instanceof ConflictException
          ? error.message
          : 'Authentication failed. Please try again.',
      );
      return res.redirect(`${applicationUrl}/auth/login?error=${message}`);
    }
  }

  @Authorization()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(req, res);
  }
}
