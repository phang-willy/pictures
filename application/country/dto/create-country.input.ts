export type CreateCountryInput = {
  name: string;
  iso2: string;
  iso3?: string | null;
  slug?: string;
  continentId: string;
  geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinate: unknown;
  } | null;
};
