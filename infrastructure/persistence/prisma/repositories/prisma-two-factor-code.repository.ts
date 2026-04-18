import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/config/prisma.service';
import { TwoFactorCodeRepository } from '@/domain/auth/repositories/two-factor-code.repository';
import { TwoFactorCodeEntity } from '@/domain/auth/entities/two-factor-code.entity';

@Injectable()
export class PrismaTwoFactorCodeRepository implements TwoFactorCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: {
    id: string;
    userId: string;
    code: string;
    expiresAt: Date;
    usedAt: Date | null;
    attempts: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return new TwoFactorCodeEntity({
      id: row.id,
      userId: row.userId,
      codeHash: row.code,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      attempts: row.attempts,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(entity: TwoFactorCodeEntity): Promise<TwoFactorCodeEntity> {
    const data = entity.toPrimitives();
    const row = await this.prisma.userTwoFactorCode.create({
      data: {
        id: data.id,
        userId: data.userId,
        code: data.codeHash,
        expiresAt: data.expiresAt,
        usedAt: data.usedAt,
        attempts: data.attempts,
      },
    });
    return this.toDomain(row);
  }

  async findLatestActiveByUserId(userId: string): Promise<TwoFactorCodeEntity | null> {
    const row = await this.prisma.userTwoFactorCode.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toDomain(row) : null;
  }

  async deleteAllActiveByUserId(userId: string): Promise<void> {
    await this.prisma.userTwoFactorCode.deleteMany({
      where: { userId, usedAt: null },
    });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.userTwoFactorCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async incrementAttempts(id: string, attempts: number): Promise<void> {
    await this.prisma.userTwoFactorCode.update({
      where: { id },
      data: { attempts },
    });
  }
}
