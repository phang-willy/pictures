import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  generateAccountConfirmationToken,
  generateSixDigitCode,
  hashPassword,
  hashTwoFactorCode,
  signAccessToken,
  signTwoFaLoginToken,
  verifyAccessToken,
  verifyPassword,
  verifyTwoFactorCode,
  verifyTwoFaLoginToken,
} from '@/auth/auth.utils';
import {
  loginRequestSchema,
  registerRequestSchema,
  resendTwoFactorRequestSchema,
  verifyTwoFactorRequestSchema,
} from '../../../../shared/schemas/index.js';
import { MailService } from '@/auth/mail.service';
import { lookupIpGeo } from '@/auth/ip-geo.lookup';

const CONFIRM_TOKEN_TTL_MS = 60 * 60 * 1000;
const TWOFA_STEP_TTL_MS = 10 * 60 * 1000;
const TWOFA_CODE_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

type RegisterResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      statusCode: number;
      field?: 'email' | 'password';
      message: string;
    };

type ConfirmResult =
  | { ok: true }
  | { ok: false; statusCode: number; message: string };

type LoginResult =
  | { ok: true; twoFactorToken: string }
  | { ok: false; field?: 'email' | 'password'; message: string };

type Verify2faResult =
  | { ok: true; accessToken: string }
  | { ok: false; field?: 'code'; message: string };

type Resend2faResult = { ok: true } | { ok: false; message: string };

type MeResult =
  | { ok: true; email: string; role: string }
  | { ok: false; message: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /** AUTH_SECRET (recommandé) ; repli AUTH_CONFIRM_SECRET ou AUTH_HMAC_SECRET pour .env existants. */
  private authSecret(): string | null {
    const s =
      process.env.AUTH_SECRET?.trim() ||
      process.env.AUTH_CONFIRM_SECRET?.trim() ||
      process.env.AUTH_HMAC_SECRET?.trim();
    return s && s.length >= 16 ? s : null;
  }

  async register(input: unknown): Promise<RegisterResult> {
    const parsed = registerRequestSchema.safeParse(input);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return {
        ok: false,
        statusCode: 400,
        field:
          firstIssue?.path[0] === 'password'
            ? 'password'
            : firstIssue?.path[0] === 'email'
              ? 'email'
              : undefined,
        message: firstIssue?.message ?? 'Donnees invalides',
      };
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return {
        ok: false,
        statusCode: 409,
        field: 'email',
        message:
          'Un compte existe peut-être déjà avec cet email. Essayez de vous connecter ou réinitialisez votre mot de passe.',
      };
    }

    const password = await hashPassword(parsed.data.password);
    const rawToken = generateAccountConfirmationToken();
    const tokenExpiresAt = new Date(Date.now() + CONFIRM_TOKEN_TTL_MS);

    const user = await this.prisma.user.create({
      data: {
        email,
        password,
        role: 'USER',
        token: rawToken,
        tokenExpiresAt,
      },
      select: { id: true, email: true },
    });

    const frontendUrl =
      process.env.FRONTEND_BASE_URL ??
      process.env.CORS_ORIGIN ??
      'http://localhost:3000';
    const confirmUrl = `${frontendUrl}/confirm?type=account&token=${encodeURIComponent(rawToken)}`;

    try {
      await this.mailService.sendAccountConfirmationEmail(
        user.email,
        confirmUrl,
      );
    } catch {
      await this.prisma.user
        .delete({ where: { id: user.id } })
        .catch(() => undefined);
      return {
        ok: false,
        statusCode: 503,
        message:
          "L'envoi de l'e-mail de confirmation a échoué. Réessayez plus tard.",
      };
    }

    return {
      ok: true,
      userId: user.id,
    };
  }

  async confirmAccount(input: unknown): Promise<ConfirmResult> {
    const body = input as { type?: unknown; token?: unknown };
    if (
      body.type !== 'account' ||
      typeof body.token !== 'string' ||
      !body.token.trim()
    ) {
      return {
        ok: false,
        statusCode: 404,
        message: 'Lien de confirmation invalide.',
      };
    }

    const token = body.token.trim();

    const notFound: ConfirmResult = {
      ok: false,
      statusCode: 404,
      message: 'Lien de confirmation invalide ou déjà utilisé.',
    };

    type TxResult = { kind: 'ok'; email: string } | { kind: 'not_found' };

    const txResult: TxResult = await this.prisma.$transaction(async (tx) => {
      const holder = await tx.user.findFirst({
        where: { token },
        select: {
          id: true,
          email: true,
          verifiedAt: true,
          tokenExpiresAt: true,
        },
      });

      if (!holder) {
        return { kind: 'not_found' as const };
      }

      if (holder.verifiedAt) {
        return { kind: 'not_found' as const };
      }

      if (!holder.tokenExpiresAt || holder.tokenExpiresAt <= new Date()) {
        return { kind: 'not_found' as const };
      }

      const updated = await tx.user.updateMany({
        where: {
          id: holder.id,
          token,
          verifiedAt: null,
          tokenExpiresAt: { gt: new Date() },
        },
        data: {
          verifiedAt: new Date(),
          token: null,
          tokenExpiresAt: null,
        },
      });

      if (updated.count === 0) {
        return { kind: 'not_found' as const };
      }

      return { kind: 'ok' as const, email: holder.email };
    });

    if (txResult.kind === 'not_found') {
      return notFound;
    }

    try {
      await this.mailService.sendAccountActivatedEmail(txResult.email);
    } catch {
      // Compte validé même si l'e-mail de remerciement échoue
    }

    return { ok: true };
  }

  async login(input: unknown): Promise<LoginResult> {
    const secret = this.authSecret();
    if (!secret) {
      return {
        ok: false,
        message:
          'Connexion indisponible : définissez AUTH_SECRET (min. 16 caractères). Les anciens noms AUTH_CONFIRM_SECRET ou AUTH_HMAC_SECRET sont encore acceptés en secours.',
      };
    }

    const parsed = loginRequestSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const path = first?.path[0];
      return {
        ok: false,
        field:
          path === 'password'
            ? 'password'
            : path === 'email'
              ? 'email'
              : undefined,
        message: first?.message ?? 'Veuillez vérifier vos identifiants.',
      };
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, verifiedAt: true, isActive: true },
    });

    if (!user) {
      return {
        ok: false,
        field: 'email',
        message:
          "Aucun compte n'est associé à cet e-mail. Vérifiez l'adresse ou inscrivez-vous pour créer un compte.",
      };
    }

    if (!user.verifiedAt) {
      return {
        ok: false,
        field: 'email',
        message:
          "Ce compte n'est pas encore confirmé. Consultez vos e-mails et utilisez le lien de confirmation avant de vous connecter.",
      };
    }

    if (!user.isActive) {
      return {
        ok: false,
        field: 'email',
        message:
          "Ce compte est désactivé. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      };
    }

    const passwordOk = await verifyPassword(
      parsed.data.password,
      user.password,
    );
    if (!passwordOk) {
      return {
        ok: false,
        field: 'password',
        message: 'Veuillez vérifier vos identifiants.',
      };
    }

    await this.prisma.userTwoFactorCode.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const plainCode = generateSixDigitCode();
    const codeHash = await hashTwoFactorCode(plainCode);
    const expiresAt = new Date(Date.now() + TWOFA_CODE_TTL_MS);

    const twoFaRow = await this.prisma.userTwoFactorCode.create({
      data: {
        userId: user.id,
        code: codeHash,
        expiresAt,
      },
    });

    try {
      await this.mailService.sendLoginTwoFactorCode(
        email,
        plainCode,
        TWOFA_CODE_TTL_MS / 60_000,
      );
    } catch {
      await this.prisma.userTwoFactorCode
        .delete({ where: { id: twoFaRow.id } })
        .catch(() => undefined);
      return {
        ok: false,
        message: "L'envoi du code par e-mail a échoué. Réessayez plus tard.",
      };
    }

    const stepExpires = Date.now() + TWOFA_STEP_TTL_MS;
    const twoFactorToken = signTwoFaLoginToken(email, stepExpires, secret);

    return { ok: true, twoFactorToken };
  }

  async verifyTwoFactor(
    input: unknown,
    clientIp: string,
  ): Promise<Verify2faResult> {
    const secret = this.authSecret();
    if (!secret) {
      return { ok: false, message: 'Service indisponible.' };
    }

    const parsed = verifyTwoFactorRequestSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const path = first?.path[0];
      return {
        ok: false,
        field: path === 'code' ? 'code' : undefined,
        message: first?.message ?? 'Données invalides.',
      };
    }

    const tokenPayload = verifyTwoFaLoginToken(
      parsed.data.twoFactorToken,
      secret,
    );
    if (!tokenPayload) {
      return {
        ok: false,
        field: 'code',
        message:
          'Session expirée. Reconnectez-vous depuis la page de connexion.',
      };
    }

    const email = tokenPayload.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, verifiedAt: true, isActive: true },
    });

    if (!user?.verifiedAt || !user.isActive) {
      return {
        ok: false,
        field: 'code',
        message: 'Session invalide. Reconnectez-vous.',
      };
    }

    const row = await this.prisma.userTwoFactorCode.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) {
      return {
        ok: false,
        field: 'code',
        message: 'Code expiré. Demandez un nouveau code.',
      };
    }

    const codeOk = await verifyTwoFactorCode(parsed.data.code, row.code);
    if (!codeOk) {
      const attempts = row.attempts + 1;
      await this.prisma.userTwoFactorCode.update({
        where: { id: row.id },
        data: { attempts },
      });
      if (attempts >= MAX_CODE_ATTEMPTS) {
        await this.prisma.userTwoFactorCode.deleteMany({
          where: { userId: user.id, usedAt: null },
        });
        return {
          ok: false,
          field: 'code',
          message: 'Trop de tentatives incorrectes. Reconnectez-vous.',
        };
      }
      return {
        ok: false,
        field: 'code',
        message: 'Code incorrect.',
      };
    }

    await this.prisma.userTwoFactorCode.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });

    const accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
    const accessToken = signAccessToken(user.id, user.email, accessExp, secret);

    const at = new Date();
    const geo = await lookupIpGeo(clientIp);
    await this.mailService.sendPostLoginSecurityNotice(user.email, {
      ip: clientIp,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      atIso: at.toISOString(),
      atDisplayFr: `${at.toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        dateStyle: 'full',
        timeStyle: 'medium',
      })} (heure de Paris)`,
    });

    return { ok: true, accessToken };
  }

  async resendTwoFactor(input: unknown): Promise<Resend2faResult> {
    const secret = this.authSecret();
    if (!secret) {
      return { ok: false, message: 'Service indisponible.' };
    }

    const parsed = resendTwoFactorRequestSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? 'Données invalides.',
      };
    }

    const tokenPayload = verifyTwoFaLoginToken(
      parsed.data.twoFactorToken,
      secret,
    );
    if (!tokenPayload) {
      return {
        ok: false,
        message:
          'Session expirée. Reconnectez-vous depuis la page de connexion.',
      };
    }

    const email = tokenPayload.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, verifiedAt: true, isActive: true },
    });

    if (!user?.verifiedAt || !user.isActive) {
      return { ok: false, message: 'Session invalide.' };
    }

    await this.prisma.userTwoFactorCode.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const plainCode = generateSixDigitCode();
    const codeHash = await hashTwoFactorCode(plainCode);
    const expiresAt = new Date(Date.now() + TWOFA_CODE_TTL_MS);

    const twoFaRow = await this.prisma.userTwoFactorCode.create({
      data: {
        userId: user.id,
        code: codeHash,
        expiresAt,
      },
    });

    try {
      await this.mailService.sendLoginTwoFactorCode(
        email,
        plainCode,
        TWOFA_CODE_TTL_MS / 60_000,
      );
    } catch {
      await this.prisma.userTwoFactorCode
        .delete({ where: { id: twoFaRow.id } })
        .catch(() => undefined);
      return {
        ok: false,
        message: "L'envoi du code a échoué. Réessayez plus tard.",
      };
    }

    return { ok: true };
  }

  async meFromBearer(authorization: string | undefined): Promise<MeResult> {
    const secret = this.authSecret();
    if (!secret) {
      return { ok: false, message: 'Service indisponible.' };
    }

    const raw = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!raw) {
      return { ok: false, message: 'Non authentifié.' };
    }

    const payload = verifyAccessToken(raw, secret);
    if (!payload) {
      return { ok: false, message: 'Session invalide ou expirée.' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { email: true, role: true, isActive: true, verifiedAt: true },
    });

    if (!user?.verifiedAt || !user.isActive) {
      return { ok: false, message: 'Compte non disponible.' };
    }

    return { ok: true, email: user.email, role: user.role };
  }
}
