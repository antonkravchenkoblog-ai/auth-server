import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { Request, Response } from 'express';

@Injectable()
export class SessionService {
  public constructor(private readonly configService: ConfigService) {}

  public async saveSession(req: Request, user: Omit<User, 'password'> & { password?: string }) {
    return new Promise((resolve, reject) => {
      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) {
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
  }

  public async destroySession(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(
              'Failed to end the session. There may be a server issue or the session has already been terminated.',
            ),
          );
        }
        res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));
        resolve();
      });
    });
  }
}

