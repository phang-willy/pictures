export type CityExistsOutput = {
  exists: boolean;
  conflicts: Array<'name' | 'slug'>;
  match?: {
    id: string;
    name: string;
    slug: string;
  };
};
