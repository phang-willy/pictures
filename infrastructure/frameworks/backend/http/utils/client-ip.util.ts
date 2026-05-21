export function extractClientIp(req: {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const forwardedFor =
    process.env.TRUST_PROXY === 'true' ? req.headers?.['x-forwarded-for'] : undefined;
  const fromForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0];
  const raw = fromForwarded?.trim() || req.ip || req.socket?.remoteAddress || '';
  return raw.replace(/^::ffff:/, '') || '0.0.0.0';
}
