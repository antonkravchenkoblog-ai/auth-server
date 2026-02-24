import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { Request, Response } from 'express';

import { parseBoolean } from '@/libs/utils/parse-boolean.util';

@Injectable()
export class SessionService {
  public constructor(private readonly configService: ConfigService) {}

  public async saveSession(req: Request, user: Omit<User, 'password'> & { password?: string }) {
    return new Promise((resolve, reject) => {
      req.session.regenerate((regenErr) => {
        if (regenErr) {
          console.log(regenErr);
          return reject(
            new InternalServerErrorException(
              'Failed to create a new session. Please try again.',
            ),
          );
        }

        req.session.userId = user.id;

        req.session.save((err) => {
          if (err) {
            console.log(err);
            return reject(
              new InternalServerErrorException(
                'Failed to save the session. Please check that the session settings are configured correctly.',
              ),
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password, ...safeUser } = user;

          resolve({
            user: safeUser,
          });
        });
      });
    });
  }

  public async destroySession(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          console.log(err)
          return reject(
            new InternalServerErrorException(
              'Failed to end the session. There may be a server issue or the session has already been terminated.',
            ),
          );
        }
        res.clearCookie(
          this.configService.getOrThrow<string>('SESSION_NAME'),
          this.getCookieOptions(),
        );
        res.clearCookie(
          this.configService.get<string>('CSRF_COOKIE_NAME') ?? 'csrf_token',
          {
            ...this.getCookieOptions(),
            httpOnly: false,
          },
        );
        resolve();
      });
    });
  }

  private getCookieOptions() {
    return {
      domain: this.configService.get<string>('SESSION_DOMAIN') || undefined,
      path: '/',
      httpOnly: parseBoolean(
        this.configService.getOrThrow<string>('SESSION_HTTP_ONLY'),
      ),
      secure: parseBoolean(
        this.configService.getOrThrow<string>('SESSION_SECURE'),
      ),
      sameSite: (this.configService.get<string>('SESSION_SAME_SITE') || 'lax') as
        | 'lax'
        | 'strict'
        | 'none',
    };
  }
}

