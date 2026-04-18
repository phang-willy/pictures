import { Injectable } from '@nestjs/common';
import type { ClientLocationPort } from '@/application/auth/ports/client-location.port';

function isPrivateOrLocalIp(ip: string): boolean {
  const n = ip.replace(/^::ffff:/, '').trim();
  if (!n || n === '127.0.0.1' || n === '::1') {
    return true;
  }
  if (n.startsWith('10.')) {
    return true;
  }
  if (n.startsWith('192.168.')) {
    return true;
  }
  const m = /^172\.(\d+)\./.exec(n);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }
  return false;
}

/**
 * Localisation via ip-api.com (HTTP, gratuit, ~45 req/min).
 * Réseaux privés / loopback → libellé local sans appel réseau.
 */
@Injectable()
export class IpApiClientLocationAdapter implements ClientLocationPort {
  async resolveLabelForIp(ip: string): Promise<string> {
    const normalized = ip.replace(/^::ffff:/, '').trim() || '0.0.0.0';
    if (isPrivateOrLocalIp(normalized)) {
      return 'Réseau local ou connexion privée';
    }
    const url = `http://ip-api.com/json/${encodeURIComponent(normalized)}?fields=status,country,city&lang=fr`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        return 'Localisation indisponible';
      }
      const data = (await res.json()) as {
        status?: string;
        country?: string;
        city?: string;
      };
      if (data.status !== 'success') {
        return 'Localisation indisponible';
      }
      const parts = [data.city, data.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : normalized;
    } catch {
      return 'Localisation indisponible';
    } finally {
      clearTimeout(timer);
    }
  }
}
