export type PasswordResetTokenEntityProps = {
  id: string;
  email: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PasswordResetTokenEntity {
  constructor(private readonly props: PasswordResetTokenEntityProps) {}

  toPrimitives() {
    return {
      id: this.props.id,
      email: this.props.email,
      expiresAt: this.props.expiresAt,
      consumedAt: this.props.consumedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
