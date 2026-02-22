import { MailService } from '@/auth/mail/mail.service';
import { UserService } from '@/user/user.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { SessionService } from '../session/session.service';
import { PrismaService } from '@/prisma.service';

import { ConfirmationDto } from './dto/confirmation.dto';
import { signPayload, verifyPayload } from '@/libs/utils/signed-token.util';

@Injectable()
export class EmailConfirmationService {
  public constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly prismaService: PrismaService,
  ) {}

  public async newVerification(req: Request, dto: ConfirmationDto) {
    const secret = this.configService.get<string>('TOKEN_SECRET');
    if (!secret) {
      throw new BadRequestException('Token secret is not configured.');
    }

    let payload: { email: string; type: string };

    try {
      payload = verifyPayload(dto.token, secret);
    } catch {
      throw new NotFoundException(
        'Verification failed. The token is invalid or has expired.',
      );
    }

    if (payload.type !== 'verification') {
      throw new BadRequestException(
        'Verification failed. The token is invalid or has expired.',
      );
    }

    const existingUser = await this.userService.findByEmail(payload.email);

    if (!existingUser) {
      throw new NotFoundException(
        'Verification failed. The token is invalid or has expired.',
      );
    }

    if (existingUser.isVerified) {
      return this.sessionService.saveSession(req, existingUser);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: existingUser.id },
      data: { isVerified: true },
      omit: { password: true },
    });

    return this.sessionService.saveSession(req, updatedUser);
  }

  public async sendVerificationToken(email: string) {
    const verificationToken = await this.generateVerificationToken(email);

    await this.mailService.sendConfirmationEmail(email, verificationToken);

    return true;
  }

  private async generateVerificationToken(email: string) {
    const ttlSeconds = this.configService.get<number>('EMAIL_TOKEN_TTL') ?? 3600;
    const secret = this.configService.get<string>('TOKEN_SECRET');

    if (!secret) {
      throw new BadRequestException('Token secret is not configured.');
    }

    const payload = {
      email,
      type: 'verification' as const,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };

    return signPayload(payload, secret);
  }
}
