import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import { ConfirmationDto } from './dto/confirmation.dto';
import { EmailConfirmationService } from './email-confirmation.service';

@Controller('auth/email-confirmation')
export class EmailConfirmationController {
  constructor(
    private readonly emailConfirmationService: EmailConfirmationService,
  ) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  public async newVerification(
    @Req() req: Request,
    @Body() dto: ConfirmationDto,
  ) {
    return this.emailConfirmationService.newVerification(req, dto);
  }
}
