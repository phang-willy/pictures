import { CitySlugVo } from '@/domain/city/value-objects/city-slug.vo';
import { CountryEntity } from '@/domain/country/entities/country.entity';

export type CityEntityProps = {
  id: string;
  country: CountryEntity;
  name: string;
  slug: CitySlugVo;
  latitude: number;
  longitude: number;
  desactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CityEntity {
  constructor(private readonly props: CityEntityProps) {}

  get id() {
    return this.props.id;
  }

  get country() {
    return this.props.country;
  }

  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get latitude() {
    return this.props.latitude;
  }

  get longitude() {
    return this.props.longitude;
  }

  get desactivatedAt() {
    return this.props.desactivatedAt;
  }

  toPrimitives() {
    return {
      id: this.props.id,
      country: this.props.country.toPrimitives(),
      name: this.props.name,
      slug: this.props.slug.value,
      latitude: this.props.latitude,
      longitude: this.props.longitude,
      desactivatedAt: this.props.desactivatedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
