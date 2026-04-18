import { Injectable } from '@nestjs/common';
import { UserRepository } from '@/domain/user/repositories/user.repository';
import { UserEntity } from '@/domain/user/entities/user.entity';
import { PasswordHashVo } from '@/domain/user/value-objects/password-hash.vo';
import { UserEmailVo } from '@/domain/user/value-objects/user-email.vo';
import { UserRoleVo } from '@/domain/user/value-objects/user-role.vo';
import { PrismaService } from '@/infrastructure/database/config/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async latestPasswordHash(userId: string): Promise<string> {
    const row = await this.prisma.password.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { password: true },
    });
    return row?.password ?? '';
  }

  private async toDomain(row: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    verifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<UserEntity> {
    const passwordHash = await this.latestPasswordHash(row.id);
    return new UserEntity({
      id: row.id,
      email: new UserEmailVo(row.email),
      role: new UserRoleVo(row.role),
      passwordHash: new PasswordHashVo(passwordHash),
      isActive: row.isActive,
      verifiedAt: row.verifiedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const data = user.toPrimitives();
    const row = await this.prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        verifiedAt: data.verifiedAt,
        passwords: {
          create: {
            password: data.passwordHash,
          },
        },
      },
    });
    return this.toDomain(row);
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const data = user.toPrimitives();
    const row = await this.prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        verifiedAt: data.verifiedAt,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async createWithPassword(params: {
    email: string;
    passwordHash: string;
    role?: 'ADMIN' | 'USER';
    confirmationToken?: string | null;
    confirmationTokenExpiresAt?: Date | null;
  }): Promise<UserEntity> {
    const row = await this.prisma.user.create({
      data: {
        email: params.email.trim().toLowerCase(),
        role: params.role ?? 'USER',
        token: params.confirmationToken ?? null,
        tokenExpiresAt: params.confirmationTokenExpiresAt ?? null,
        loginAttempt: 0,
        passwords: {
          create: {
            password: params.passwordHash,
          },
        },
      },
    });
    return this.toDomain(row);
  }

  async findByConfirmationToken(token: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findFirst({
      where: { token: token.trim() },
    });
    return row ? this.toDomain(row) : null;
  }

  async confirmAccountByToken(token: string): Promise<UserEntity | null> {
    const now = new Date();
    const existing = await this.prisma.user.findFirst({
      where: {
        token: token.trim(),
        verifiedAt: null,
        tokenExpiresAt: { gt: now },
      },
    });
    if (!existing) {
      return null;
    }
    const row = await this.prisma.user.update({
      where: { id: existing.id },
      data: {
        verifiedAt: now,
        token: null,
        tokenExpiresAt: null,
      },
    });
    return this.toDomain(row);
  }

  async getRecentPasswordHashes(userId: string, limit: number): Promise<string[]> {
    const rows = await this.prisma.password.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { password: true },
    });
    return rows.map((row) => row.password);
  }

  async appendPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.password.create({
      data: {
        userId,
        password: passwordHash,
      },
    });
  }
}
