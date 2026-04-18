import { PasswordHashVo } from '@/domain/user/value-objects/password-hash.vo';
import { UserEmailVo } from '@/domain/user/value-objects/user-email.vo';
import { UserRoleVo } from '@/domain/user/value-objects/user-role.vo';

export type UserEntityProps = {
  id: string;
  email: UserEmailVo;
  role: UserRoleVo;
  passwordHash: PasswordHashVo;
  isActive: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class UserEntity {
  constructor(private readonly props: UserEntityProps) {}

  get id() {
    return this.props.id;
  }

  get email() {
    return this.props.email;
  }

  get role() {
    return this.props.role;
  }

  withEmail(nextEmail: UserEmailVo): UserEntity {
    return new UserEntity({
      ...this.props,
      email: nextEmail,
      updatedAt: new Date(),
    });
  }

  withRole(nextRole: UserRoleVo): UserEntity {
    return new UserEntity({
      ...this.props,
      role: nextRole,
      updatedAt: new Date(),
    });
  }

  toPrimitives() {
    return {
      id: this.props.id,
      email: this.props.email.value,
      role: this.props.role.value,
      passwordHash: this.props.passwordHash.value,
      isActive: this.props.isActive,
      verifiedAt: this.props.verifiedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
