export type IpGeoSummary = {
  country: string;
  region: string;
  city: string;
};

function isPrivateOrLocalIp(normalized: string): boolean {
  if (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === 'unknown' ||
    normalized === 'inconnu'
  ) {
    return true;
  }
  if (/^10\./.test(normalized)) {
    return true;
  }
  if (/^192\.168\./.test(normalized)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) {
    return true;
  }
  return false;
}

/**
 * Géolocalisation indicative (HTTPS, sans clé) via geojs.io.
 * Les IP locales / RFC1918 ne sont pas interrogées.
 */
export async function lookupIpGeo(ip: string): Promise<IpGeoSummary> {
  const empty = (): IpGeoSummary => ({ country: '—', region: '—', city: '—' });

  const normalized = ip.replace(/^::ffff:/i, '').trim();
  if (!normalized || isPrivateOrLocalIp(normalized)) {
    return {
      country: 'Réseau local ou adresse privée',
      region: '—',
      city: '—',
    };
  }

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    const url = `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(normalized)}.json`;
    const response = await fetch(url, { signal: ac.signal });
    clearTimeout(timer);
    if (!response.ok) {
      return empty();
    }
    const data = (await response.json()) as {
      country?: string;
      region?: string;
      city?: string;
    };
    return {
      country:
        typeof data.country === 'string' && data.country ? data.country : '—',
      region:
        typeof data.region === 'string' && data.region ? data.region : '—',
      city: typeof data.city === 'string' && data.city ? data.city : '—',
    };
  } catch {
    return empty();
  }
}
