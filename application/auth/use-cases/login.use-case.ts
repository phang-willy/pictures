import type { MailSenderPort } from '@/application/auth/ports/mail-sender.port';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';
import type { OtpGeneratorPort } from '@/application/auth/ports/otp-generator.port';
import type { PasswordHasherPort } from '@/application/auth/ports/password-hasher.port';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import type { UserRepository } from '@/domain/user/repositories/user.repository';
import type { TwoFactorCodeRepository } from '@/domain/auth/repositories/two-factor-code.repository';
import { TwoFactorCodeEntity } from '@/domain/auth/entities/two-factor-code.entity';
import { wrapWithSecurityFooter } from '@/application/auth/mail/security-email-html';

export class LoginUseCase {
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
    const body = input as { email?: unknown; password?: unknown };
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return { ok: false, field: 'email', message: 'Email and password are required.' };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { ok: false, field: 'email', message: 'Invalid credentials.' };
    }

    const userData = user.toPrimitives();
    if (!userData.verifiedAt) {
      return { ok: false, field: 'email', message: 'Account is not verified yet.' };
    }

    if (!userData.isActive) {
      return { ok: false, field: 'email', message: 'Account is disabled.' };
    }

    const recentHashes = await this.userRepository.getRecentPasswordHashes(user.id, 1);
    const currentHash = recentHashes[0];
    if (!currentHash) {
      return { ok: false, field: 'password', message: 'No password found for this account.' };
    }

    const passwordOk = await this.passwordHasher.verify(password, currentHash);
    if (!passwordOk) {
      return { ok: false, field: 'password', message: 'Invalid credentials.' };
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
    const inner = `<p>Votre code de connexion est <strong>${plainCode}</strong> (valide 10 minutes).</p>`;
    try {
      await this.mailSender.send({
        to: email,
        subject: 'Code de connexion',
        html: wrapWithSecurityFooter(inner, { clientIp, locationLabel }),
      });
    } catch {
      await this.twoFactorCodeRepository.deleteAllActiveByUserId(user.id);
      return {
        ok: false,
        field: 'email',
        message: "Impossible d'envoyer l'e-mail de vérification. Réessayez plus tard.",
      };
    }

    const twoFactorToken = this.tokenSigner.sign({ email }, 10 * 60);
    return { ok: true, twoFactorToken };
  }
}
