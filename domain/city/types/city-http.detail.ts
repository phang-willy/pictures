export type CityHttpDetail = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  desactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  country: {
    id: string;
    name: string;
    iso2: string;
    iso3: string | null;
    slug: string;
    continent: {
      id: string;
      code: string;
      name: string;
    };
  };
};
