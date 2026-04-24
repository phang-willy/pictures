import { CountrySlugVo } from '@/domain/country/value-objects/country-slug.vo';
import { Iso2CodeVo } from '@/domain/country/value-objects/iso2-code.vo';
import { Iso3CodeVo } from '@/domain/country/value-objects/iso3-code.vo';
import { ContinentEntity } from '@/domain/continent/entities/continent.entity';

export type CountryEntityProps = {
  id: string;
  name: string;
  iso2: Iso2CodeVo;
  iso3: Iso3CodeVo | null;
  slug: CountrySlugVo;
  continent: ContinentEntity;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinate: unknown;
  } | null;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CountryEntity {
  constructor(private readonly props: CountryEntityProps) {}

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get iso2() {
    return this.props.iso2;
  }

  get iso3() {
    return this.props.iso3;
  }

  get slug() {
    return this.props.slug;
  }

  get continent() {
    return this.props.continent;
  }

  get geometry() {
    return this.props.geometry;
  }

  toPrimitives() {
    return {
      id: this.props.id,
      name: this.props.name,
      iso2: this.props.iso2.value,
      iso3: this.props.iso3?.value ?? null,
      slug: this.props.slug.value,
      continent: this.props.continent.toPrimitives(),
      geometry: this.props.geometry,
      deactivatedAt: this.props.deactivatedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
