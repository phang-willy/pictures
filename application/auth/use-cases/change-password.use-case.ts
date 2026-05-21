import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { PasswordHasherPort } from '@/application/auth/ports/password-hasher.port';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import type { TwoFactorCodeRepository } from '@/domain/auth/repositories/two-factor-code.repository';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';
import { changePasswordRequestSchema } from '@/application/auth/contracts/auth.request.schemas';

export class ChangePasswordUseCase {
  constructor(
    private readonly tokenSigner: TokenSignerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly mailSender: MailSenderPort,
    private readonly clientLocation: ClientLocationPort,
    private readonly userRepository: UserRepository,
    private readonly twoFactorCodeRepository: TwoFactorCodeRepository,
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

  async execute(
    input: unknown,
    authorization: string | undefined,
    _clientIp: string,
    cookieHeader?: string,
  ) {
    const fromBearer = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    const token = fromBearer || this.getCookieValue(cookieHeader, 'pictures_at');
    if (!token) {
      return { ok: false, message: 'Not authenticated.' };
    }

    const tokenPayload = this.tokenSigner.verify<{ sub?: string }>(token);
    if (!tokenPayload?.sub) {
      return { ok: false, message: 'Session invalid or expired.' };
    }

    const parsed = changePasswordRequestSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0];
      return {
        ok: false,
        ...(typeof field === 'string' ? { field } : {}),
        message: issue?.message ?? 'Invalid payload.',
      };
    }

    const { oldPassword, newPassword } = parsed.data;

    const user = await this.userRepository.findById(tokenPayload.sub);
    if (!user) {
      return { ok: false, message: 'Account not found.' };
    }

    const recentHashes = await this.userRepository.getRecentPasswordHashes(user.id, 5);
    const currentHash = recentHashes[0];
    if (!currentHash) {
      return { ok: false, message: 'No password found.' };
    }

    const oldPasswordOk = await this.passwordHasher.verify(oldPassword, currentHash);
    if (!oldPasswordOk) {
      return { ok: false, field: 'oldPassword', message: 'Old password is incorrect.' };
    }

    for (const hash of recentHashes) {
      const same = await this.passwordHasher.verify(newPassword, hash);
      if (same) {
        return {
          ok: false,
          field: 'newPassword',
          message: 'New password must be different from previous ones.',
        };
      }
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.appendPasswordHash(user.id, passwordHash);
    await this.twoFactorCodeRepository.deleteAllActiveByUserId(user.id);

    const userData = user.toPrimitives();
    const locationLabel = await this.clientLocation.resolveLabelForIp(_clientIp);
    const inner =
      '<p>Votre mot de passe a été modifié depuis la page profil (ou un appareil connecté).</p>';
    try {
      await this.mailSender.send({
        to: userData.email,
        subject: 'Mot de passe modifié',
        html: wrapWithSecurityFooter(inner, { clientIp: _clientIp, locationLabel }),
      });
    } catch {
      /* notification secondaire */
    }

    return { ok: true };
  }
}
