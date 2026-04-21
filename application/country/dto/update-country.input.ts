export type UpdateCountryInput = {
  id: string;
  name?: string;
  iso2?: string;
  iso3?: string | null;
  slug?: string;
  continentId?: string;
  /** ISO string pour soft-delete, `null` pour réactiver ; omis = inchangé */
  desactivatedAt?: string | null;
  geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinate: unknown;
  } | null;
};
