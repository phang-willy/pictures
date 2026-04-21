export type UpdateCityInput = {
  id: string;
  countryId?: string;
  name?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  desactivatedAt?: string | null;
};
