import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { PasswordHasherPort } from '@/application/auth/ports/password-hasher.port';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import type { PasswordResetTokenRepository } from '@/domain/auth/repositories/password-reset-token.repository';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';

export class ResetPasswordUseCase {
  constructor(
    private readonly tokenSigner: TokenSignerPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly mailSender: MailSenderPort,
    private readonly clientLocation: ClientLocationPort,
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(input: unknown, clientIp: string) {
    const body = input as {
      token?: unknown;
      email?: unknown;
      password?: unknown;
      confirmPassword?: unknown;
    };

    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const confirmPassword =
      typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!token || !email || !password || !confirmPassword) {
      return { ok: false, message: 'Invalid payload.' };
    }
    if (password !== confirmPassword) {
      return { ok: false, field: 'confirmPassword', message: 'Passwords do not match.' };
    }

    const tokenPayload = this.tokenSigner.verify<{ fpId?: string; email?: string }>(token);
    if (!tokenPayload?.fpId || !tokenPayload?.email) {
      return { ok: false, message: 'Token is invalid or expired.' };
    }

    if (tokenPayload.email.trim().toLowerCase() !== email) {
      return { ok: false, field: 'email', message: 'Email does not match token.' };
    }

    const resetToken = await this.passwordResetTokenRepository.findById(tokenPayload.fpId);
    if (!resetToken) {
      return { ok: false, message: 'Reset token not found.' };
    }

    const resetTokenData = resetToken.toPrimitives();
    if (
      resetTokenData.email !== email ||
      resetTokenData.consumedAt !== null ||
      resetTokenData.expiresAt <= new Date()
    ) {
      return { ok: false, message: 'Reset token is invalid, expired, or already used.' };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { ok: false, message: 'User not found.' };
    }

    const recentHashes = await this.userRepository.getRecentPasswordHashes(user.id, 5);
    for (const existingHash of recentHashes) {
      const same = await this.passwordHasher.verify(password, existingHash);
      if (same) {
        return {
          ok: false,
          field: 'password',
          message: 'New password must differ from your last passwords.',
        };
      }
    }

    const passwordHash = await this.passwordHasher.hash(password);
    await this.userRepository.appendPasswordHash(user.id, passwordHash);
    await this.passwordResetTokenRepository.markAsConsumed(
      resetTokenData.id,
      new Date(),
    );

    const userData = user.toPrimitives();
    const locationLabel = await this.clientLocation.resolveLabelForIp(clientIp);
    const inner =
      '<p>Votre mot de passe a été modifié suite à une demande de réinitialisation.</p>';
    try {
      await this.mailSender.send({
        to: userData.email,
        subject: 'Mot de passe modifié',
        html: wrapWithSecurityFooter(inner, { clientIp, locationLabel }),
      });
    } catch {
      /* notification secondaire */
    }

    return { ok: true };
  }
}
