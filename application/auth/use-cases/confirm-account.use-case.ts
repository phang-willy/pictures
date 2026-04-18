import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';

export class ConfirmAccountUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailSender: MailSenderPort,
    private readonly clientLocation: ClientLocationPort,
  ) {}

  async execute(input: unknown, clientIp: string) {
    const body = input as { type?: unknown; token?: unknown };
    if (body.type !== 'account' || typeof body.token !== 'string' || !body.token.trim()) {
      return { ok: false, message: 'Invalid confirmation link.' };
    }

    const token = body.token.trim();
    const confirmed = await this.userRepository.confirmAccountByToken(token);
    if (!confirmed) {
      return { ok: false, message: 'Invalid or expired confirmation link.' };
    }

    const userData = confirmed.toPrimitives();
    const locationLabel = await this.clientLocation.resolveLabelForIp(clientIp);
    const inner = '<p>Votre compte est activé, vous pouvez vous connecter.</p>';
    try {
      await this.mailSender.send({
        to: userData.email,
        subject: 'Compte activé',
        html: wrapWithSecurityFooter(inner, { clientIp, locationLabel }),
      });
    } catch {
      /* e-mail secondaire */
    }

    return { ok: true };
  }
}
