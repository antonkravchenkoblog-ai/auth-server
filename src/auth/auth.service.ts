import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthMethod } from '@prisma/client';
import { verify } from 'argon2';
import { Request, Response } from 'express';

import { UserService } from '@/user/user.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailConfirmationService } from './email-confirmation/email-confirmation.service';
import { SessionService } from './session/session.service';
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service';

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  public async register(dto: RegisterDto) {
    const isExists = await this.userService.findByEmail(dto.email);

    if (isExists) {
      throw new ConflictException(
        'Unable to complete registration. Please try again or use a different email.',
      );
    }

    const newUser = await this.userService.create(
      dto.email,
      dto.password,
      dto.name,
      '',
      AuthMethod.CREDENTIALS,
      false,
    );

    await this.emailConfirmationService.sendVerificationToken(newUser.email);

    return {
      message:
        'You have successfully registered. Please verify your email. A message has been sent to your email address.',
    };
  }

  public async login(req: Request, dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Invalid email or password. Please check the provided data and try again.',
      );
    }

    if (user.method !== AuthMethod.CREDENTIALS) {
      throw new UnauthorizedException(
        'This account uses social login. Please sign in using the appropriate provider.',
      );
    }

    const isValidPassword = await verify(user.password, dto.password);

    if (!isValidPassword) {
      throw new UnauthorizedException(
        'Invalid email or password. Please check the provided data and try again.',
      );
    }

    if (!user.isVerified) {
      await this.emailConfirmationService.sendVerificationToken(user.email);
      throw new UnauthorizedException(
        'Please verify your email address before signing in. A new verification link has been sent.',
      );
    }

    if (user.isTwoFactorEnabled) {
      if (!dto.code) {
        await this.twoFactorAuthService.sendTwoFactorToken(user.email);

        return {
          message:
            'Check your email. A two-factor authentication code is required.',
        };
      }

      await this.twoFactorAuthService.validateTwoFactorToken(
        user.email,
        dto.code,
      );
    }

    return this.sessionService.saveSession(req, user);
  }

  public async handleOAuthLogin(
    req: Request,
    profile: {
      id: string;
      email: string;
      name: string;
      picture: string;
      accessToken: string;
      refreshToken?: string;
      provider: string;
    },
  ) {
    // 1. Ищем существующего пользователя по socialId (Google ID)
    const existingUserBySocialId = await this.userService.findBySocialId(profile.id);

    if (existingUserBySocialId) {
      return this.sessionService.saveSession(req, existingUserBySocialId);
    }

    // 2. Проверяем, не занят ли email другим аккаунтом
    const existingUserByEmail = await this.userService.findByEmail(
      profile.email,
    );

    if (existingUserByEmail) {
      console.log(
        'An account with this email already exists. Please sign in with your existing account',
      );
      throw new ConflictException(
        'An account with this email already exists. Please sign in with your existing account.',
      );
    }

    // 3. Создаём нового пользователя с socialId
    const newUser = await this.userService.create(
      profile.email,
      '',
      profile.name,
      profile.picture,
      AuthMethod.GOOGLE,
      true,
      profile.id,
    );

    return this.sessionService.saveSession(req, newUser);
  }

  public async logout(req: Request, res: Response): Promise<void> {
    return this.sessionService.destroySession(req, res);
  }
}
