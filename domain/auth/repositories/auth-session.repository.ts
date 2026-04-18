import { AuthSessionEntity } from '@/domain/auth/entities/auth-session.entity';

export interface AuthSessionRepository {
  create(session: AuthSessionEntity): Promise<AuthSessionEntity>;
}
