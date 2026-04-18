import { Injectable } from '@nestjs/common';
import { AuthSessionRepository } from '@/domain/auth/repositories/auth-session.repository';
import { AuthSessionEntity } from '@/domain/auth/entities/auth-session.entity';

@Injectable()
export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  async create(session: AuthSessionEntity): Promise<AuthSessionEntity> {
    return session;
  }
}
