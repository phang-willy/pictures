import { ContinentCodeVo } from '@/domain/continent/value-objects/continent-code.vo';

export type ContinentEntityProps = {
  id: string;
  code: ContinentCodeVo;
  name: string;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ContinentEntity {
  constructor(private readonly props: ContinentEntityProps) {}

  get id() {
    return this.props.id;
  }

  get code() {
    return this.props.code;
  }

  get name() {
    return this.props.name;
  }

  get deactivatedAt() {
    return this.props.deactivatedAt;
  }

  toPrimitives() {
    return {
      id: this.props.id,
      code: this.props.code.value,
      name: this.props.name,
      deactivatedAt: this.props.deactivatedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
