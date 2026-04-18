import type { CountryEntityProps } from '../entities/country.entity';

/**
 * Pays tel que renvoyé par l’API (JSON) côté admin.
 * Champs scalaires / ISO : pas les VO de {@link CountryEntityProps}.
 */
export type CountryHttpDetail = {
  id: CountryEntityProps['id'];
  name: CountryEntityProps['name'];
  geometry: CountryEntityProps['geometry'];
  continentId: string;
  iso2: string;
  iso3: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  continent: {
    id: string;
    code: string;
    name: string;
  };
};
