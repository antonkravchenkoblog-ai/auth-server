import { Module } from '@nestjs/common';

import { EmailConfirmationModule } from '@/auth/email-confirmation/email-confirmation.module';
import { PrismaService } from '@/prisma.service';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [EmailConfirmationModule],
  controllers: [UserController],
  providers: [PrismaService, UserService],
  exports: [UserService],
})
export class UserModule {}
