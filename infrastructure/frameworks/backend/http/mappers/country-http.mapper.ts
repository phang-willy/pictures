import type { CountryEntity } from '@/domain/country/entities/country.entity';

/**
 * Objet JSON pour `GET /country/:id` — pas l’instance d’entité (sinon sérialisation `{ props: … }`).
 */
export function toCountryDetailHttp(country: CountryEntity, includeGeometry: boolean) {
  const data = country.toPrimitives();
  const continent = data.continent;
  return {
    id: data.id,
    continent: {
      id: continent.id,
      code: continent.code,
      name: continent.name,
    },
    name: data.name,
    iso2: data.iso2,
    iso3: data.iso3,
    slug: data.slug,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    desactivatedAt: data.desactivatedAt,
    geometry: includeGeometry ? data.geometry : null,
  };
}

export function toCountryListItemHttp(country: CountryEntity, includeGeometry: boolean) {
  const data = country.toPrimitives();
  const base = {
    id: data.id,
    name: data.name,
    iso2: data.iso2,
    iso3: data.iso3,
    slug: data.slug,
    continent: data.continent,
    desactivatedAt: data.desactivatedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  if (!includeGeometry) {
    return base;
  }
  return {
    ...base,
    geometry: data.geometry,
  };
}
