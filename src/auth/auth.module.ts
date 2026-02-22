import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';

import { getRecaptchaConfig } from '@/libs/config/recaptcha.config';
import { MailService } from '@/auth/mail/mail.service';
import { PrismaService } from '@/prisma.service';
import { UserService } from '@/user/user.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailConfirmationModule } from './email-confirmation/email-confirmation.module';
import { SessionModule } from './session/session.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service';

@Module({
  imports: [
    PassportModule,
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getRecaptchaConfig,
      inject: [ConfigService],
    }),
    EmailConfirmationModule,
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UserService, MailService, TwoFactorAuthService, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
