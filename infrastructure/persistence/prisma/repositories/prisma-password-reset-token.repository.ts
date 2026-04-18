import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/config/prisma.service';
import { PasswordResetTokenRepository } from '@/domain/auth/repositories/password-reset-token.repository';
import { PasswordResetTokenEntity } from '@/domain/auth/entities/password-reset-token.entity';

@Injectable()
export class PrismaPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: {
    id: string;
    email: string;
    expiredAt: Date;
    consumedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return new PasswordResetTokenEntity({
      id: row.id,
      email: row.email,
      expiresAt: row.expiredAt,
      consumedAt: row.consumedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(entity: PasswordResetTokenEntity): Promise<PasswordResetTokenEntity> {
    const data = entity.toPrimitives();
    const row = await this.prisma.forgotPassword.create({
      data: {
        id: data.id,
        email: data.email,
        expiredAt: data.expiresAt,
        consumedAt: data.consumedAt,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<PasswordResetTokenEntity | null> {
    const row = await this.prisma.forgotPassword.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async markAsConsumed(id: string, consumedAt: Date): Promise<void> {
    await this.prisma.forgotPassword.update({
      where: { id },
      data: { consumedAt },
    });
  }
}
