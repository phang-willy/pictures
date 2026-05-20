export type UpdatePostInput = {
  id: string;
  cityId?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  content?: string | null;
  latitude?: number;
  longitude?: number;
  deactivatedAt?: string | null;
};
