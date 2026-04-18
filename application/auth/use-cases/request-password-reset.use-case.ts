import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import type { PasswordResetTokenRepository } from '@/domain/auth/repositories/password-reset-token.repository';
import { PasswordResetTokenEntity } from '@/domain/auth/entities/password-reset-token.entity';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';

export class RequestPasswordResetUseCase {
  constructor(
    private readonly tokenSigner: TokenSignerPort,
    private readonly mailSender: MailSenderPort,
    private readonly clientLocation: ClientLocationPort,
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(input: unknown, clientIp: string) {
    const body = input as { email?: unknown };
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return { ok: false, message: 'Email is required.' };
    }

    const softOkMessage =
      'If this email exists, a secure reset link has been sent.';
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { ok: true, message: softOkMessage };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const row = await this.passwordResetTokenRepository.create(
      new PasswordResetTokenEntity({
        id: crypto.randomUUID(),
        email,
        expiresAt,
        consumedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const rowData = row.toPrimitives();
    const token = this.tokenSigner.sign(
      {
        fpId: rowData.id,
        email,
      },
      60 * 60,
    );

    const baseUrl = (process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const resetUrl = `${baseUrl}/forgot-password?type=new&token=${encodeURIComponent(token)}`;

    const locationLabel = await this.clientLocation.resolveLabelForIp(clientIp);
    const inner = `<p>Réinitialisez votre mot de passe en suivant <a href="${resetUrl}">ce lien</a> (valide 1 h).</p>`;
    try {
      await this.mailSender.send({
        to: email,
        subject: 'Réinitialisation du mot de passe',
        html: wrapWithSecurityFooter(inner, { clientIp, locationLabel }),
      });
    } catch {
      return { ok: false, message: "Impossible d'envoyer l'e-mail. Réessayez plus tard." };
    }

    return { ok: true, message: softOkMessage };
  }
}
