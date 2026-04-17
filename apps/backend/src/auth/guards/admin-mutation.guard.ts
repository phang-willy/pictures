import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@/auth/auth.service';

/**
 * Pour les méthodes **GET / HEAD / OPTIONS** : aucune vérification (lecture publique ou laissée telle quelle).
 * Pour les autres méthodes : utilisateur **connecté** (cookie HttpOnly ou Bearer) et **rôle ADMIN**.
 *
 * @see https://docs.nestjs.com/security/authorization
 */
@Injectable()
export class AdminMutationGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = (req.method ?? 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    const result = await this.authService.meFromBearer(
      req.headers.authorization,
      req.headers.cookie,
    );

    if (!result.ok) {
      throw new UnauthorizedException(result.message);
    }

    if (result.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    return true;
  }
}
