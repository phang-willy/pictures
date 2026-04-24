import type { PostEntity } from '@/domain/post/entities/post.entity';

export function toPostListItemHttp(post: PostEntity) {
  const data = post.toPrimitives();
  const city = data.city;
  const country = city.country;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    deactivatedAt: data.deactivatedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    city: {
      id: city.id,
      name: city.name,
      slug: city.slug,
      latitude: city.latitude,
      longitude: city.longitude,
      country: {
        id: country.id,
        name: country.name,
        iso2: country.iso2,
        iso3: country.iso3,
        slug: country.slug,
        continent: country.continent,
      },
    },
  };
}
