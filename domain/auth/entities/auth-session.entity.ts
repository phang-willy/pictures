export type AuthSessionEntityProps = {
  userId: string;
  accessToken: string;
  expiresAt: Date;
};

export class AuthSessionEntity {
  constructor(private readonly props: AuthSessionEntityProps) {}

  toPrimitives() {
    return {
      userId: this.props.userId,
      accessToken: this.props.accessToken,
      expiresAt: this.props.expiresAt,
    };
  }
}
