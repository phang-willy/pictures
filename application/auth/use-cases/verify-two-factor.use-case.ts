import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { PasswordHasherPort } from '@/application/auth/ports/password-hasher.port';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import type { TwoFactorCodeRepository } from '@/domain/auth/repositories/two-factor-code.repository';
import type { AuthSessionRepository } from '@/domain/auth/repositories/auth-session.repository';
import { AuthSessionEntity } from '@/domain/auth/entities/auth-session.entity';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';

export class VerifyTwoFactorUseCase {
  constructor(
    private readonly tokenSigner: TokenSignerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly mailSender: MailSenderPort,
    private readonly clientLocation: ClientLocationPort,
    private readonly userRepository: UserRepository,
    private readonly twoFactorCodeRepository: TwoFactorCodeRepository,
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async execute(input: unknown, clientIp: string) {
    const body = input as { twoFactorToken?: unknown; code?: unknown };
    const token =
      typeof body?.twoFactorToken === 'string' ? body.twoFactorToken.trim() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!token || !code) {
      return { ok: false, field: 'code', message: 'Invalid payload.' };
    }

    const tokenPayload = this.tokenSigner.verify<{ email?: string }>(token);
    const email = tokenPayload?.email?.trim().toLowerCase();
    if (!email) {
      return {
        ok: false,
        field: 'code',
        message: 'Session expired. Please login again.',
      };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { ok: false, field: 'code', message: 'Session invalid.' };
    }

    const row = await this.twoFactorCodeRepository.findLatestActiveByUserId(user.id);
    if (!row) {
      return { ok: false, field: 'code', message: 'Code expired. Request a new one.' };
    }

    const p = row.toPrimitives();
    const codeOk = await this.passwordHasher.verify(code, p.codeHash);
    if (!codeOk) {
      const attempts = p.attempts + 1;
      await this.twoFactorCodeRepository.incrementAttempts(p.id, attempts);
      if (attempts >= 5) {
        await this.twoFactorCodeRepository.deleteAllActiveByUserId(user.id);
        return {
          ok: false,
          field: 'code',
          message: 'Too many attempts. Please login again.',
        };
      }
      return { ok: false, field: 'code', message: 'Invalid code.' };
    }

    await this.twoFactorCodeRepository.markAsUsed(p.id);

    const ttlSeconds = 60 * 60 * 24 * 7;
    const accessToken = this.tokenSigner.sign(
      {
        sub: user.id,
        email: user.email.value,
        role: user.role.value,
      },
      ttlSeconds,
    );

    await this.authSessionRepository.create(
      new AuthSessionEntity({
        userId: user.id,
        accessToken,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      }),
    );

    const locationLabel = await this.clientLocation.resolveLabelForIp(clientIp);
    const inner =
      '<p>Une connexion vient d’être enregistrée sur votre compte (après validation du code).</p>';
    try {
      await this.mailSender.send({
        to: user.email.value,
        subject: 'Nouvelle connexion à votre compte',
        html: wrapWithSecurityFooter(inner, { clientIp, locationLabel }),
      });
    } catch {
      /* alerte secondaire */
    }

    return { ok: true, accessToken };
  }
}
