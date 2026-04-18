export interface TokenSignerPort {
  sign(payload: Record<string, unknown>, expiresInSeconds: number): string;
  verify<T>(token: string): T | null;
}
