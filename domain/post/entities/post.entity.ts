import { CityEntity } from '@/domain/city/entities/city.entity';
import { PostSlugVo } from '@/domain/post/value-objects/post-slug.vo';

export type PostEntityProps = {
  id: string;
  city: CityEntity;
  name: string;
  slug: PostSlugVo;
  description: string | null;
  content: string | null;
  latitude: number;
  longitude: number;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PostEntity {
  constructor(private readonly props: PostEntityProps) {}

  get id() {
    return this.props.id;
  }

  get city() {
    return this.props.city;
  }

  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get content() {
    return this.props.content;
  }

  get latitude() {
    return this.props.latitude;
  }

  get longitude() {
    return this.props.longitude;
  }

  get deactivatedAt() {
    return this.props.deactivatedAt;
  }

  toPrimitives() {
    return {
      id: this.props.id,
      city: this.props.city.toPrimitives(),
      name: this.props.name,
      slug: this.props.slug.value,
      description: this.props.description,
      content: this.props.content,
      latitude: this.props.latitude,
      longitude: this.props.longitude,
      deactivatedAt: this.props.deactivatedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
