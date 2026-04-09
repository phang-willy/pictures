const TWO_FACTOR_LOGIN_TOKEN_KEY = "pictures.twoFactorLoginToken";
const ACCESS_TOKEN_KEY = "pictures.accessToken";

export function setTwoFactorLoginToken(token: string): void {
  try {
    sessionStorage.setItem(TWO_FACTOR_LOGIN_TOKEN_KEY, token);
  } catch {
    /* quota / private mode */
  }
}

export function getTwoFactorLoginToken(): string | null {
  try {
    return sessionStorage.getItem(TWO_FACTOR_LOGIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearTwoFactorLoginToken(): void {
  try {
    sessionStorage.removeItem(TWO_FACTOR_LOGIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function setAccessToken(token: string): void {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAccessToken(): void {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
