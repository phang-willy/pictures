export interface MailSenderPort {
  send(params: { to: string; subject: string; html: string }): Promise<void>;
}
