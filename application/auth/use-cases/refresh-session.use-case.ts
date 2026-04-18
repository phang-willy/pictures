import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';

export class RefreshSessionUseCase {
  constructor(
    private readonly tokenSigner: TokenSignerPort,
    private readonly userRepository: UserRepository,
  ) {}

  private getCookieValue(cookieHeader: string | undefined, key: string): string {
    if (!cookieHeader) {
      return '';
    }
    const parts = cookieHeader.split(';').map((part) => part.trim());
    const found = parts.find((part) => part.startsWith(`${key}=`));
    if (!found) {
      return '';
    }
    return found.slice(key.length + 1).trim();
  }

  execute(
    authorization: string | undefined,
    cookieHeader?: string,
  ) {
    const fromBearer = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    const token = fromBearer || this.getCookieValue(cookieHeader, 'pictures_at');

    if (!token) {
      return { ok: false, message: 'Not authenticated.' };
    }

    const payload = this.tokenSigner.verify<{ sub?: string }>(token);
    if (!payload?.sub) {
      return { ok: false, message: 'Session invalid or expired.' };
    }

    return this.userRepository.findById(payload.sub).then((user) => {
      if (!user) {
        return { ok: false, message: 'Account not found.' };
      }
      const data = user.toPrimitives();
      if (!data.isActive || !data.verifiedAt) {
        return { ok: false, message: 'Account unavailable.' };
      }
      return {
        ok: true,
        email: data.email,
        role: data.role,
      };
    });
  }
}
