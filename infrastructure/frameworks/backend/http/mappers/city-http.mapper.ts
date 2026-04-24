import type { CityEntity } from '@/domain/city/entities/city.entity';

export function toCityListItemHttp(city: CityEntity) {
  const data = city.toPrimitives();
  return {
    id: data.id,
    country: data.country,
    name: data.name,
    slug: data.slug,
    latitude: data.latitude,
    longitude: data.longitude,
    deactivatedAt: data.deactivatedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
