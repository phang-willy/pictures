export type TwoFactorCodeEntityProps = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

export class TwoFactorCodeEntity {
  constructor(private readonly props: TwoFactorCodeEntityProps) {}

  toPrimitives() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      codeHash: this.props.codeHash,
      expiresAt: this.props.expiresAt,
      usedAt: this.props.usedAt,
      attempts: this.props.attempts,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
