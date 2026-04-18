import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { OtpGeneratorPort } from '@/application/auth/ports/otp-generator.port';
import type { PasswordHasherPort } from '@/application/auth/ports/password-hasher.port';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import type { TwoFactorCodeRepository } from '@/domain/auth/repositories/two-factor-code.repository';
import { TwoFactorCodeEntity } from '@/domain/auth/entities/two-factor-code.entity';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';

export class RequestTwoFactorUseCase {
  constructor(
    private readonly tokenSigner: TokenSignerPort,
    private readonly otpGenerator: OtpGeneratorPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly mailSender: MailSenderPort,
    private readonly clientLocation: ClientLocationPort,
    private readonly userRepository: UserRepository,
    private readonly twoFactorCodeRepository: TwoFactorCodeRepository,
  ) {}

  async execute(input: unknown, clientIp: string) {
    const body = input as { twoFactorToken?: unknown };
    const token = typeof body?.twoFactorToken === 'string' ? body.twoFactorToken : '';
    if (!token) {
      return { ok: false, message: 'twoFactorToken is required.' };
    }

    const payload = this.tokenSigner.verify<{ email?: string }>(token);
    const email = payload?.email?.trim().toLowerCase();
    if (!email) {
      return { ok: false, message: 'Session expired. Please login again.' };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { ok: false, message: 'Session invalid.' };
    }

    await this.twoFactorCodeRepository.deleteAllActiveByUserId(user.id);

    const plainCode = this.otpGenerator.generate(6);
    const codeHash = await this.passwordHasher.hash(plainCode);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await this.twoFactorCodeRepository.create(
      new TwoFactorCodeEntity({
        id: crypto.randomUUID(),
        userId: user.id,
        codeHash,
        expiresAt,
        usedAt: null,
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const locationLabel = await this.clientLocation.resolveLabelForIp(clientIp);
    const inner = `<p>Votre nouveau code est <strong>${plainCode}</strong> (valide 10 minutes).</p>`;
    try {
      await this.mailSender.send({
        to: email,
        subject: 'Nouveau code de vérification',
        html: wrapWithSecurityFooter(inner, { clientIp, locationLabel }),
      });
    } catch {
      await this.twoFactorCodeRepository.deleteAllActiveByUserId(user.id);
      return {
        ok: false,
        message: "Impossible d'envoyer l'e-mail. Réessayez plus tard.",
      };
    }

    return { ok: true };
  }
}
