export function getForgotPasswordUrl(): string {
  const baseUrl = (process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  return `${baseUrl}/forgot-password`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function wrapWithSecurityFooter(
  innerHtml: string,
  meta: { clientIp: string; locationLabel: string },
): string {
  const ip = escapeHtml(meta.clientIp);
  const loc = escapeHtml(meta.locationLabel);
  return (
    `${innerHtml}` +
    `<p style="color:#444;font-size:14px;margin-top:20px;padding-top:16px;border-top:1px solid #ddd">` +
    `<strong>Infos connexion :</strong><br/>`+
    `IP : ${ip} <br/>`+
    `Localisation : ${loc} <br/>`+
    `Si c'est pas vous, changez vite <a href="${getForgotPasswordUrl()}">votre mot de passe</a>.` +
    `</p>`
  );
}
