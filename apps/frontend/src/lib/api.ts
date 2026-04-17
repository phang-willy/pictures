function resolveApiBaseUrl(): string {
  if (typeof window === "undefined") {
    const serverOnly =
      process.env.API_URL?.trim() || process.env.INTERNAL_API_URL?.trim();
    if (serverOnly) {
      return serverOnly.replace(/\/$/, "");
    }
  }

  const envBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  const candidates = envBase
    ? envBase
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const currentHost = hostname.toLowerCase();

    const parsedCandidates = candidates
      .map((candidate) => {
        try {
          return { raw: candidate, url: new URL(candidate) };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is { raw: string; url: URL } => entry !== null);

    const exactHostMatch = parsedCandidates.find(
      (entry) => entry.url.hostname.toLowerCase() === currentHost,
    );
    if (exactHostMatch) {
      return exactHostMatch.raw.replace(/\/$/, "");
    }

    const localhostCandidate = parsedCandidates.find((entry) =>
      ["localhost", "127.0.0.1", "::1"].includes(
        entry.url.hostname.toLowerCase(),
      ),
    );
    if (localhostCandidate) {
      const port = localhostCandidate.url.port || "3001";
      return `${protocol}//${hostname}:${port}`;
    }

    if (parsedCandidates[0]) {
      return parsedCandidates[0].raw.replace(/\/$/, "");
    }

    return `${protocol}//${hostname}:3001`;
  }

  if (candidates[0]) {
    return candidates[0].replace(/\/$/, "");
  }

  return "http://localhost:3001";
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const API_URL = resolveApiBaseUrl() + p;
  return API_URL;
}

/**
 * Requêtes vers l’API avec envoi des cookies HttpOnly (`credentials: 'include'`).
 * Ne pas y placer de jeton dans les en-têtes : l’auth repose sur le cookie `pictures_at`.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { ...init, credentials: "include" });
}
