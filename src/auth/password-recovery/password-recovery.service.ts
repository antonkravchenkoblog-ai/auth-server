import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from '@/auth/mail/mail.service';
import { UserService } from '@/user/user.service';
import { signPayload, verifyPayload } from '@/libs/utils/signed-token.util';

import { NewPasswordDto } from './dto/new-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class PasswordRecoveryService {
  public constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  public async resetPassword(dto: ResetPasswordDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (!existingUser) {
      return true;
    }

    const passwordResetToken = await this.generatePasswordResetToken(
      existingUser.email,
    );

    await this.mailService.sendPasswordResetEmail(
      existingUser.email,
      passwordResetToken,
    );

    return true;
  }

  public async newPassword(dto: NewPasswordDto, token: string) {
    const secret = this.configService.get<string>('TOKEN_SECRET');

    if (!secret) {
      throw new BadRequestException('Token secret is not configured.');
    }

    let payload: { email: string; type: string };

    try {
      payload = verifyPayload(token, secret);
    } catch {
      throw new NotFoundException(
        'Password reset failed. The link is invalid or has expired.',
      );
    }

    if (payload.type !== 'password_reset') {
      throw new BadRequestException(
        'Password reset failed. The link is invalid or has expired.',
      );
    }

    const existingUser = await this.userService.findByEmail(payload.email);

    if (!existingUser) {
      throw new NotFoundException(
        'Password reset failed. The link is invalid or has expired.',
      );
    }

    await this.userService.updatePassword(existingUser.id, dto.password);

    return true;
  }

  private async generatePasswordResetToken(email: string) {
    const ttlSeconds =
      this.configService.get<number>('PASSWORD_RESET_TOKEN_TTL') ?? 3600;
    const secret = this.configService.get<string>('TOKEN_SECRET');

    if (!secret) {
      throw new BadRequestException('Token secret is not configured.');
    }

    const payload = {
      email,
      type: 'password_reset' as const,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };

    return signPayload(payload, secret);
  }
}
