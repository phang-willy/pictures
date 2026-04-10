import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST ?? 'localhost';
    const port = Number(process.env.SMTP_PORT ?? 1025);
    const fromEmail = process.env.SMTP_FROM ?? 'noreply@pictures.local';
    const appName = process.env.APP_NAME ?? 'Pictures';
    this.fromAddress = `"${appName}" <${fromEmail}>`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
    });
  }

  async sendAccountConfirmationEmail(
    to: string,
    confirmUrl: string,
  ): Promise<void> {
    const appName = process.env.APP_NAME ?? 'Pictures';
    const subject = `Confirmez votre compte ${appName}`;
    const text = [
      `Bonjour,`,
      ``,
      `Merci pour votre inscription sur ${appName}.`,
      ``,
      `E-mail destinataire : ${to}`,
      ``,
      `Vous disposez d'1 heure pour confirmer votre adresse e-mail. Passé ce délai, le lien ne sera plus valide.`,
      ``,
      `Lien de confirmation :`,
      confirmUrl,
      ``,
      `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
    ].join('\n');

    const html = `
<p>Bonjour,</p>
<p>Merci pour votre inscription sur <strong>${escapeHtml(appName)}</strong>.</p>
<p><strong>E-mail destinataire :</strong> ${escapeHtml(to)}</p>
<p><strong>Vous disposez d'1 heure</strong> pour confirmer votre adresse e-mail. Passé ce délai, le lien ne sera plus valide.</p>
<p><a href="${escapeHtml(confirmUrl)}">Confirmer mon compte</a></p>
<p style="word-break:break-all;font-size:0.9em;color:#666">${escapeHtml(confirmUrl)}</p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  async sendLoginTwoFactorCode(
    to: string,
    code: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const appName = process.env.APP_NAME ?? 'Pictures';
    const subject = `Code de connexion ${appName}`;
    const text = [
      `Bonjour,`,
      ``,
      `Voici votre code de vérification pour vous connecter à ${appName} :`,
      ``,
      code,
      ``,
      `Ce code expire dans ${expiresInMinutes} minutes.`,
      ``,
      `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et vérifiez la sécurité de votre compte.`,
    ].join('\n');

    const html = `
<p>Bonjour,</p>
<p>Voici votre <strong>code de vérification</strong> pour vous connecter à <strong>${escapeHtml(appName)}</strong> :</p>
<p style="font-size:1.5rem;letter-spacing:0.2em;font-weight:600;font-family:monospace">${escapeHtml(code)}</p>
<p>Ce code expire dans <strong>${expiresInMinutes} minutes</strong>.</p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  async sendAccountActivatedEmail(to: string): Promise<void> {
    const appName = process.env.APP_NAME ?? 'Pictures';
    const subject = `Votre compte ${appName} est actif`;
    const text = [
      `Bonjour,`,
      ``,
      `Merci ! Votre compte sur ${appName} est désormais confirmé et actif.`,
      ``,
      `Vous pouvez vous connecter quand vous le souhaitez.`,
    ].join('\n');

    const html = `
<p>Bonjour,</p>
<p>Merci ! Votre compte sur <strong>${escapeHtml(appName)}</strong> est désormais <strong>confirmé et actif</strong>.</p>
<p>Vous pouvez vous connecter quand vous le souhaitez.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  /**
   * Alerte sécurité après connexion (OTP validé). Ne doit pas faire échouer la connexion si l’envoi échoue.
   */
  async sendPostLoginSecurityNotice(
    to: string,
    details: {
      ip: string;
      country: string;
      region: string;
      city: string;
      atIso: string;
      atDisplayFr: string;
    },
  ): Promise<void> {
    const appName = process.env.APP_NAME ?? 'Pictures';
    const frontendUrl =
      process.env.FRONTEND_BASE_URL ??
      process.env.CORS_ORIGIN ??
      'http://localhost:3000';
    const subject = `Connexion à votre compte ${appName}`;
    const text = [
      `Bonjour,`,
      ``,
      `Vous venez de vous connecter avec succès à ${appName} après validation du code de vérification.`,
      ``,
      `Résumé de la session :`,
      `- Date et heure (UTC) : ${details.atIso}`,
      `- Affichage local (référence) : ${details.atDisplayFr}`,
      `- Adresse IP : ${details.ip}`,
      `- Pays : ${details.country}`,
      `- Région / État : ${details.region}`,
      `- Ville : ${details.city}`,
      ``,
      `Si cette connexion ne vient pas de vous, changez immédiatement votre mot de passe depuis la page de connexion :`,
      `${frontendUrl}/login`,
      ``,
      `En cas de doute, sécurisez votre adresse e-mail et contactez le support.`,
    ].join('\n');

    const html = `
<p>Bonjour,</p>
<p>Vous venez de vous connecter avec succès à <strong>${escapeHtml(appName)}</strong> après validation du code de vérification.</p>
<p><strong>Résumé de la session</strong></p>
<ul>
<li>Date et heure (UTC) : ${escapeHtml(details.atIso)}</li>
<li>Référence locale : ${escapeHtml(details.atDisplayFr)}</li>
<li>Adresse IP : ${escapeHtml(details.ip)}</li>
<li>Pays : ${escapeHtml(details.country)}</li>
<li>Région / État : ${escapeHtml(details.region)}</li>
<li>Ville : ${escapeHtml(details.city)}</li>
</ul>
<p><strong>Si ce n'était pas vous</strong>, changez immédiatement votre mot de passe depuis la <a href="${escapeHtml(frontendUrl)}/login">page de connexion</a>.</p>
<p>En cas de doute, sécurisez votre adresse e-mail et contactez le support.</p>
`.trim();

    try {
      await this.send({ to, subject, text, html });
    } catch (error) {
      this.logger.warn(
        `Echec de l'envoi de l'e-mail d'alerte connexion vers ${to} (la session reste valide).`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  /** Alerte après blocage suite à des tentatives de connexion échouées. */
  async sendLoginLockNotice(
    to: string,
    details: {
      ip: string;
      country: string;
      region: string;
      city: string;
      atIso: string;
      atDisplayFr: string;
      attemptCount: number;
      unlockDisplayFr: string;
      permanentLock: boolean;
      contactUrl: string;
    },
  ): Promise<void> {
    const appName = process.env.APP_NAME ?? 'Pictures';
    const subject = `Sécurité du compte ${appName} — accès temporairement restreint`;
    const bodyPermanent = [
      `Bonjour,`,
      ``,
      `Suite à plusieurs tentatives de connexion infructueuses, l'accès à votre compte ${appName} a été restreint de façon durable.`,
      ``,
      `Si vous êtes bien le titulaire du compte, faites une demande via notre page de contact :`,
      details.contactUrl,
      ``,
      `Résumé de la tentative :`,
      `- Date et heure (UTC) : ${details.atIso}`,
      `- Référence locale : ${details.atDisplayFr}`,
      `- Adresse IP : ${details.ip}`,
      `- Pays : ${details.country}`,
      `- Région / État : ${details.region}`,
      `- Ville : ${details.city}`,
      `- Nombre de tentatives enregistrées : ${details.attemptCount}`,
    ].join('\n');
    const bodyTemporary = [
      `Bonjour,`,
      ``,
      `Suite à des tentatives de connexion infructueuses, l'accès à votre compte ${appName} est restreint jusqu'au ${details.unlockDisplayFr}.`,
      ``,
      `Résumé de la tentative :`,
      `- Date et heure (UTC) : ${details.atIso}`,
      `- Référence locale : ${details.atDisplayFr}`,
      `- Adresse IP : ${details.ip}`,
      `- Pays : ${details.country}`,
      `- Région / État : ${details.region}`,
      `- Ville : ${details.city}`,
      `- Nombre de tentatives enregistrées : ${details.attemptCount}`,
      ``,
      `Si ce n'était pas vous, changez votre mot de passe dès que l'accès est rétabli.`,
    ].join('\n');
    const text = details.permanentLock ? bodyPermanent : bodyTemporary;

    const htmlPermanent = `
<p>Bonjour,</p>
<p>Suite à plusieurs tentatives de connexion infructueuses, l'accès à votre compte <strong>${escapeHtml(appName)}</strong> a été <strong>restreint de façon durable</strong>.</p>
<p>Si vous êtes bien le titulaire du compte, faites une demande via notre <a href="${escapeHtml(details.contactUrl)}">page de contact</a>.</p>
<p><strong>Résumé</strong></p>
<ul>
<li>Date et heure (UTC) : ${escapeHtml(details.atIso)}</li>
<li>Référence locale : ${escapeHtml(details.atDisplayFr)}</li>
<li>Adresse IP : ${escapeHtml(details.ip)}</li>
<li>Pays : ${escapeHtml(details.country)}</li>
<li>Région / État : ${escapeHtml(details.region)}</li>
<li>Ville : ${escapeHtml(details.city)}</li>
<li>Tentatives enregistrées : ${details.attemptCount}</li>
</ul>
`.trim();

    const htmlTemporary = `
<p>Bonjour,</p>
<p>Suite à des tentatives de connexion infructueuses, l'accès à votre compte <strong>${escapeHtml(appName)}</strong> est restreint jusqu'au <strong>${escapeHtml(details.unlockDisplayFr)}</strong>.</p>
<p><strong>Résumé</strong></p>
<ul>
<li>Date et heure (UTC) : ${escapeHtml(details.atIso)}</li>
<li>Référence locale : ${escapeHtml(details.atDisplayFr)}</li>
<li>Adresse IP : ${escapeHtml(details.ip)}</li>
<li>Pays : ${escapeHtml(details.country)}</li>
<li>Région / État : ${escapeHtml(details.region)}</li>
<li>Ville : ${escapeHtml(details.city)}</li>
<li>Tentatives enregistrées : ${details.attemptCount}</li>
</ul>
<p>Si ce n'était pas vous, changez votre mot de passe dès que l'accès est rétabli.</p>
`.trim();
    const html = details.permanentLock ? htmlPermanent : htmlTemporary;

    try {
      await this.send({ to, subject, text, html });
    } catch (error) {
      this.logger.warn(
        `Echec de l'envoi de l'e-mail de blocage connexion vers ${to}.`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async sendForgotPasswordResetLink(
    to: string,
    resetUrl: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const appName = process.env.APP_NAME ?? 'Pictures';
    const subject = `Réinitialiser votre mot de passe ${appName}`;
    const text = [
      `Bonjour,`,
      ``,
      `Vous avez demandé la réinitialisation du mot de passe pour ${appName}.`,
      ``,
      `Vous disposez d'environ ${expiresInMinutes} minutes pour choisir un nouveau mot de passe via le lien ci-dessous. Passé ce délai, le lien ne fonctionnera plus.`,
      ``,
      `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste inchangé.`,
      ``,
      resetUrl,
    ].join('\n');

    const html = `
<p>Bonjour,</p>
<p>Vous avez demandé la <strong>réinitialisation du mot de passe</strong> pour <strong>${escapeHtml(appName)}</strong>.</p>
<p><strong>Vous disposez d'environ ${expiresInMinutes} minutes</strong> pour choisir un nouveau mot de passe. Si ce n'est pas vous, ne faites rien : votre mot de passe reste inchangé.</p>
<p><a href="${escapeHtml(resetUrl)}">Choisir un nouveau mot de passe</a></p>
<p style="word-break:break-all;font-size:0.9em;color:#666">${escapeHtml(resetUrl)}</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  async sendPasswordChangedConfirmation(
    to: string,
    details: {
      ip: string;
      country: string;
      region: string;
      city: string;
      atIso: string;
      atDisplayFr: string;
      /** Texte libre affiché en tête (ex. origine du changement). */
      contextMessage?: string;
    },
  ): Promise<void> {
    const appName = process.env.APP_NAME ?? 'Pictures';
    const frontendUrl =
      process.env.FRONTEND_BASE_URL ??
      process.env.CORS_ORIGIN ??
      'http://localhost:3000';
    const forgotUrl = `${frontendUrl}/forgot-password`;
    const subject = `Mot de passe modifié — ${appName}`;
    const intro =
      details.contextMessage?.trim() ??
      `Le mot de passe de votre compte ${appName} vient d'être modifié.`;
    const text = [
      `Bonjour,`,
      ``,
      intro,
      ``,
      `Résumé :`,
      `- Date et heure (UTC) : ${details.atIso}`,
      `- Référence locale : ${details.atDisplayFr}`,
      `- Adresse IP : ${details.ip}`,
      `- Pays : ${details.country}`,
      `- Région / État : ${details.region}`,
      `- Ville : ${details.city}`,
      ``,
      `Si ce n'était pas vous, réinitialisez immédiatement votre mot de passe :`,
      forgotUrl,
    ].join('\n');

    const htmlIntro = details.contextMessage?.trim()
      ? `<p>${escapeHtml(details.contextMessage.trim())}</p>`
      : `<p>Le mot de passe de votre compte <strong>${escapeHtml(appName)}</strong> vient d'être <strong>modifié</strong>.</p>`;
    const html = `
<p>Bonjour,</p>
${htmlIntro}
<p><strong>Résumé</strong></p>
<ul>
<li>Date et heure (UTC) : ${escapeHtml(details.atIso)}</li>
<li>Référence locale : ${escapeHtml(details.atDisplayFr)}</li>
<li>Adresse IP : ${escapeHtml(details.ip)}</li>
<li>Pays : ${escapeHtml(details.country)}</li>
<li>Région / État : ${escapeHtml(details.region)}</li>
<li>Ville : ${escapeHtml(details.city)}</li>
</ul>
<p><strong>Si ce n'était pas vous</strong>, <a href="${escapeHtml(forgotUrl)}">réinitialisez votre mot de passe</a> sans attendre.</p>
`.trim();

    try {
      await this.send({ to, subject, text, html });
    } catch (error) {
      this.logger.warn(
        `Echec de l'envoi de l'e-mail de confirmation changement MDP vers ${to}.`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  private async send(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      this.logger.error(
        `Echec d'envoi e-mail vers ${options.to}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
