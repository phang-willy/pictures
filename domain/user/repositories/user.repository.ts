import { UserEntity } from '@/domain/user/entities/user.entity';

export interface UserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  createWithPassword(params: {
    email: string;
    passwordHash: string;
    role?: 'ADMIN' | 'USER';
    confirmationToken?: string | null;
    confirmationTokenExpiresAt?: Date | null;
  }): Promise<UserEntity>;
  findByConfirmationToken(token: string): Promise<UserEntity | null>;
  confirmAccountByToken(token: string): Promise<UserEntity | null>;
  getRecentPasswordHashes(userId: string, limit: number): Promise<string[]>;
  appendPasswordHash(userId: string, passwordHash: string): Promise<void>;
}
