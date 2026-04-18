import { PasswordResetTokenEntity } from '@/domain/auth/entities/password-reset-token.entity';

export interface PasswordResetTokenRepository {
  create(entity: PasswordResetTokenEntity): Promise<PasswordResetTokenEntity>;
  findById(id: string): Promise<PasswordResetTokenEntity | null>;
  markAsConsumed(id: string, consumedAt: Date): Promise<void>;
}
