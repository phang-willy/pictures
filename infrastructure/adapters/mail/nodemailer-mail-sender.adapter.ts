import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailSenderPort } from '@/application/auth/ports/mail-sender.port';

/**
 * Tous les e-mails applicatifs (2FA, reset, inscription, alertes) passent ici.
 * Expéditeur affiché : `SMTP_FROM` ; serveur : `SMTP_HOST`:`SMTP_PORT` (ex. Maildev en dev).
 */
@Injectable()
export class NodemailerMailSenderAdapter implements MailSenderPort {
  async send(params: { to: string; subject: string; html: string }): Promise<void> {
    const host = process.env.SMTP_HOST ?? 'maildev';
    const port = Number(process.env.SMTP_PORT ?? 1025);
    const from = process.env.SMTP_FROM ?? 'noreply@pictures.local';

    const transporter = nodemailer.createTransport({ host, port, secure: false });
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  }
}
