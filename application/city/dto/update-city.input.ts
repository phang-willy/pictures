export type UpdateCityInput = {
  id: string;
  countryId?: string;
  name?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  deactivatedAt?: string | null;
};
