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

/**
 * Construit l’en-tête `Cookie` à partir du store Next (`cookies().getAll()`).
 * À utiliser avec `serverFetchApi` pour relayer l’auth HttpOnly vers l’API en RSC.
 */
export function toCookieHeader(
  pairs: ReadonlyArray<{ name: string; value: string }>,
): string | undefined {
  if (pairs.length === 0) {
    return undefined;
  }
  return pairs.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Appels `fetch` côté serveur (Server Components, handlers) vers l’URL interne de l’API.
 * Les cookies ne sont pas envoyés automatiquement : passer `toCookieHeader(await cookies().getAll())`.
 * Côté client, préférer `apiFetch` (`credentials: "include"`).
 */
export function serverFetchApi(
  path: string,
  cookieHeader: string | undefined,
  init?: RequestInit,
): Promise<Response> {
  const url = apiUrl(path);
  const headers = new Headers(init?.headers);
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }
  return fetch(url, {
    ...init,
    cache: init?.cache ?? "no-store",
    headers,
  }).catch((cause: unknown) => {
    throw new Error(
      `Impossible de joindre l’API (${url}). Vérifiez API_URL ou INTERNAL_API_URL pour le rendu serveur (Docker, etc.).`,
      { cause },
    );
  });
}

/**
 * RSC : réponse Nest `success({ item })` — 404 → `null`.
 */
export async function serverFetchApiItem<T>(
  path: string,
  cookieHeader: string | undefined,
  init?: RequestInit,
): Promise<T | null> {
  const res = await serverFetchApi(path, cookieHeader, init);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`L'API a répondu ${res.status} (${path}).`);
  }
  const json = (await res.json()) as { item?: T | null };
  if (json.item === undefined || json.item === null) {
    return null;
  }
  return json.item;
}

/**
 * RSC : réponse Nest `success({ items: [...] })`.
 */
export async function serverFetchApiItems<T>(
  path: string,
  cookieHeader: string | undefined,
  init?: RequestInit,
): Promise<T[]> {
  const res = await serverFetchApi(path, cookieHeader, init);
  if (!res.ok) {
    throw new Error(`L'API a répondu ${res.status} (${path}).`);
  }
  const json = (await res.json()) as { success?: boolean; items?: unknown };
  if (json.success === false) {
    throw new Error(`Réponse invalide (${path}).`);
  }
  if (!Array.isArray(json.items)) {
    throw new Error(`Réponse invalide : items attendu (${path}).`);
  }
  return json.items as T[];
}
