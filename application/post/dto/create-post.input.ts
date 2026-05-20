export type CreatePostInput = {
  cityId: string;
  name: string;
  slug?: string;
  /** Résumé court (plain text) */
  description?: string | null;
  /** Corps HTML (éditeur riche) */
  content?: string | null;
  latitude: number;
  longitude: number;
};
