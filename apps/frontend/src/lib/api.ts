function resolveApiBaseUrl(): string {
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
