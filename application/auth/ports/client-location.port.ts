/** Libellé lisible pour l’affichage dans les e-mails (ville, pays, ou « local »). */
export interface ClientLocationPort {
  resolveLabelForIp(ip: string): Promise<string>;
}
