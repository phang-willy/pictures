import { TwoFactorCodeEntity } from '@/domain/auth/entities/two-factor-code.entity';

export interface TwoFactorCodeRepository {
  create(entity: TwoFactorCodeEntity): Promise<TwoFactorCodeEntity>;
  findLatestActiveByUserId(userId: string): Promise<TwoFactorCodeEntity | null>;
  deleteAllActiveByUserId(userId: string): Promise<void>;
  markAsUsed(id: string): Promise<void>;
  incrementAttempts(id: string, attempts: number): Promise<void>;
}
