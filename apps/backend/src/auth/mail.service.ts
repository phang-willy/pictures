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
