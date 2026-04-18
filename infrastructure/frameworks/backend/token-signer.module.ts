import { Module } from '@nestjs/common';
import { TOKEN_SIGNER_PORT } from '@/application/auth/ports/di-tokens';
import { JwtTokenSignerAdapter } from '@/infrastructure/adapters/security/jwt-token-signer.adapter';

@Module({
  providers: [{ provide: TOKEN_SIGNER_PORT, useClass: JwtTokenSignerAdapter }],
  exports: [TOKEN_SIGNER_PORT],
})
export class TokenSignerModule {}
