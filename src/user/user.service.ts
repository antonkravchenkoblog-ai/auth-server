import { PrismaService } from '@/prisma.service';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthMethod } from '@prisma/client';
import { hash } from 'argon2';


import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'The requested resource was not found. Please check the provided data.',
      );
    }

    return user;
  }

  public async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
  }

  public async findBySocialId(socialId: string) {
    return this.prismaService.user.findUnique({
      where: {
        socialId,
      },
    });
  }

  public async create(
    email: string,
    password: string,
    displayName: string,
    picture: string,
    method: AuthMethod,
    isVerified: boolean,
    socialId?: string,
  ) {
    return this.prismaService.user.create({
      data: {
        email,
        password: password ? await hash(password) : null,
        displayName,
        picture,
        method,
        isVerified,
        socialId,
      },
      omit: {
        password: true,
      },
    });
  }

  public async update(userId: string, dto: UpdateUserDto) {
    const user = await this.findById(userId);

    const isEmailChanged = dto.email && dto.email !== user.email;

    if (isEmailChanged) {
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Unable to update profile. Please verify the provided data and try again.');
      }
    }

    return this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        email: dto.email,
        displayName: dto.name,
        isTwoFactorEnabled: dto.isTwoFactorEnabled,
        ...(isEmailChanged && { isVerified: false }),
      },
    });
  }

  public async updatePassword(userId: string, password: string) {
    const passwordHash = await hash(password);

    return this.prismaService.user.update({
      where: { id: userId },
      data: { password: passwordHash },
      omit: { password: true },
    });
  }
}
