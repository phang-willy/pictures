export type CreatePostInput = {
  cityId: string;
  name: string;
  slug?: string;
  description?: string | null;
  latitude: number;
  longitude: number;
};
