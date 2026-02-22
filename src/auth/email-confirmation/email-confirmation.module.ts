import { Module } from '@nestjs/common';

import { MailModule } from '@/auth/mail/mail.module';
import { MailService } from '@/auth/mail/mail.service';
import { PrismaService } from '@/prisma.service';
import { UserService } from '@/user/user.service';

import { SessionModule } from '../session/session.module';

import { EmailConfirmationController } from './email-confirmation.controller';
import { EmailConfirmationService } from './email-confirmation.service';

@Module({
  imports: [MailModule, SessionModule],
  controllers: [EmailConfirmationController],
  providers: [EmailConfirmationService, PrismaService, UserService, MailService],
  exports: [EmailConfirmationService],
})
export class EmailConfirmationModule {}
