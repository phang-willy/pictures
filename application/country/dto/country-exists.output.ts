export type CountryExistsOutput = {
  exists: boolean;
  conflicts: Array<'iso2' | 'iso3' | 'name' | 'slug'>;
  match?: {
    id: string;
    name: string;
    iso2: string;
    iso3: string | null;
  };
};
