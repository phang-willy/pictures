export type UpdateCityInput = {
  id: string;
  countryId?: string;
  name?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  deletedAt?: string | null;
};
