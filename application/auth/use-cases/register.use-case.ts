import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { PasswordHasherPort } from '@/application/auth/ports/password-hasher.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';

export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly mailSender: MailSenderPort,
    private readonly clientLocation: ClientLocationPort,
  ) {}

  async execute(input: unknown, clientIp: string) {
    const body = input as { email?: unknown; password?: unknown };
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return { ok: false, field: 'email', message: 'Email and password are required.' };
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      return {
        ok: false,
        field: 'email',
        message: 'An account may already exist with this email.',
      };
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const token = crypto.randomUUID().replace(/-/g, '');
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const user = await this.userRepository.createWithPassword({
      email,
      passwordHash,
      role: 'USER',
      confirmationToken: token,
      confirmationTokenExpiresAt: tokenExpiresAt,
    });

    const baseUrl = (process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const confirmUrl = `${baseUrl}/confirm?type=account&token=${encodeURIComponent(token)}`;

    const locationLabel = await this.clientLocation.resolveLabelForIp(clientIp);
    const inner = `<p>Confirmez votre compte avec <a href="${confirmUrl}">ce lien</a> (valide 1 h).</p>`;
    try {
      await this.mailSender.send({
        to: email,
        subject: 'Confirmez votre compte',
        html: wrapWithSecurityFooter(inner, { clientIp, locationLabel }),
      });
    } catch {
      return {
        ok: false,
        field: 'email',
        message: "Impossible d'envoyer l'e-mail de confirmation. Réessayez plus tard.",
      };
    }

    return { ok: true, userId: user.id };
  }
}
