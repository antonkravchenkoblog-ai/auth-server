import { createHmac } from 'crypto';

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from '@/auth/mail/mail.service';

const DEFAULT_TWO_FACTOR_TTL = 300; // seconds
const TWO_FACTOR_WINDOW = 1; // allow +/-1 window for minor clock drift

@Injectable()
export class TwoFactorAuthService {
  public constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private getSecret() {
    const secret = this.configService.get<string>('TWO_FACTOR_TOKEN_SECRET') ??
      this.configService.get<string>('TOKEN_SECRET');

    if (!secret) {
      throw new BadRequestException('Two-factor secret is not configured.');
    }

    return secret;
  }

  private generateCode(email: string, timeStep: number) {
    const secret = this.getSecret();
    const hmac = createHmac('sha1', secret)
      .update(`${email}:${timeStep}`)
      .digest('hex');

    return (parseInt(hmac.slice(-8), 16) % 1_000_000)
      .toString()
      .padStart(6, '0');
  }

  private currentTimeStep(ttlSeconds: number) {
    return Math.floor(Date.now() / 1000 / ttlSeconds);
  }

  public async validateTwoFactorToken(email: string, code: string) {
    const ttlSeconds =
      this.configService.get<number>('TWO_FACTOR_TOKEN_TTL') ??
      DEFAULT_TWO_FACTOR_TTL;

    const currentStep = this.currentTimeStep(ttlSeconds);
    const valid = Array.from({ length: TWO_FACTOR_WINDOW * 2 + 1 })
      .some((_, index) => {
        const step = currentStep + index - TWO_FACTOR_WINDOW;
        return this.generateCode(email, step) === code;
      });

    if (!valid) {
      throw new BadRequestException(
        'Invalid or expired authentication code. Please request a new one.',
      );
    }

    return true;
  }

  public async sendTwoFactorToken(email: string) {
    const ttlSeconds =
      this.configService.get<number>('TWO_FACTOR_TOKEN_TTL') ??
      DEFAULT_TWO_FACTOR_TTL;
    const code = this.generateCode(email, this.currentTimeStep(ttlSeconds));

    await this.mailService.sendTwoFactorTokenEmail(email, code);

    return true;
  }
}
