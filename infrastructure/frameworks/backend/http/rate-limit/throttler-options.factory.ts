import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import { getRoleFromRequest } from '@/infrastructure/frameworks/backend/http/auth/access-token-role.util';
import { extractClientIp } from '@/infrastructure/frameworks/backend/http/utils/client-ip.util';
import {
  RATE_LIMIT_ADMIN,
  RATE_LIMIT_DEFAULT,
  RATE_LIMIT_WINDOW_MS,
} from '@/infrastructure/frameworks/backend/http/rate-limit/rate-limit.constants';
import { createHash } from 'node:crypto';

function generateGlobalKey(
  _context: ExecutionContext,
  tracker: string,
  throttlerName: string,
): string {
  return createHash('sha256').update(`${throttlerName}:${tracker}`).digest('hex');
}

export function createThrottlerOptions(tokenSigner: TokenSignerPort): ThrottlerModuleOptions {
  return {
    throttlers: [
      {
        name: 'default',
        ttl: RATE_LIMIT_WINDOW_MS,
        limit: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          return getRoleFromRequest(tokenSigner, req) === 'ADMIN'
            ? RATE_LIMIT_ADMIN
            : RATE_LIMIT_DEFAULT;
        },
        getTracker: (req) => {
          const ip = extractClientIp(req);
          const role = getRoleFromRequest(tokenSigner, req);
          return `${ip}:${role}`;
        },
      },
    ],
    generateKey: generateGlobalKey,
  };
}
