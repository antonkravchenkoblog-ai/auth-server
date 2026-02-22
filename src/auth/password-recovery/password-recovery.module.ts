import { Module } from '@nestjs/common';

import { MailService } from '@/auth/mail/mail.service';
import { PrismaService } from '@/prisma.service';
import { UserService } from '@/user/user.service';

import { PasswordRecoveryController } from './password-recovery.controller';
import { PasswordRecoveryService } from './password-recovery.service';

@Module({
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService, UserService, MailService, PrismaService],
})
export class PasswordRecoveryModule {}
