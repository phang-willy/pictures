/**
 * Durée de vie du JWT et du cookie HttpOnly (ms).
 * Source unique pour `auth.service` (exp du jeton) et options cookie.
 */
export const ACCESS_TOKEN_TTL_MS: number = 7 * 24 * 60 * 60 * 1000;
