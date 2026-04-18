import { apiUrl } from "@/lib/api";

const TWO_FACTOR_LOGIN_TOKEN_KEY = "pictures.twoFactorLoginToken";
const LEGACY_ACCESS_TOKEN_KEY = "pictures.accessToken";

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

/** Ancien stockage local du jeton : nettoyage pour ne rien laisser en JS. */
export function clearLegacyAccessTokenStorage(): void {
  try {
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Invalide la session côté serveur (cookie HttpOnly) puis nettoie le stockage obsolète.
 * À appeler à la déconnexion ou quand une route protégée renvoie une erreur d’auth.
 */
export async function logoutAuthSession(): Promise<void> {
  clearLegacyAccessTokenStorage();
  try {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* réseau : le navigateur peut quand même avoir effacé l’état local */
  }
}
