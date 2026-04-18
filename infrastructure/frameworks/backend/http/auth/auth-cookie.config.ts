export const ACCESS_TOKEN_COOKIE_NAME = 'pictures_at';

export function accessTokenCookieOptions(maxAgeMs: number) {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  } as const;
}

export function clearAccessTokenCookie(response: {
  clearCookie: (name: string, options: Record<string, unknown>) => void;
}) {
  const secure = process.env.NODE_ENV === 'production';
  response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
  });
}
