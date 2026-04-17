import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ACCESS_TOKEN_TTL_MS } from './access-token-ttl.const';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  accessTokenCookieOptions,
  clearAccessTokenCookie,
} from './auth-cookie.config';
import { AuthService } from '@/auth/auth.service';
import { extractClientIp } from '@/auth/client-ip.util';
import {
  ChangePasswordRequestBodyDto,
  ConfirmAccountRequestBodyDto,
  ForgotPasswordRequestBodyDto,
  ForgotPasswordResetRequestBodyDto,
  LoginRequestBodyDto,
  RegisterRequestBodyDto,
  ResendTwoFactorRequestBodyDto,
  VerifyTwoFactorRequestBodyDto,
} from '@/auth/dto/auth-swagger.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Toujours 200 : évite le bruit console sur fetch (4xx). */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inscription',
    description:
      'Réponse toujours en HTTP 200 ; erreurs métier via `success: false`. Désactivé si `REGISTER_ON` ≠ `true` sur le serveur.',
  })
  @ApiBody({ type: RegisterRequestBodyDto })
  async register(@Body() body: unknown, @Res() response: Response) {
    if (process.env.REGISTER_ON !== 'true') {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: "L'inscription est désactivée.",
      });
    }

    const result = await this.authService.register(body);
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
        ...(result.field ? { field: result.field } : {}),
      });
    }

    return response.status(HttpStatus.OK).json({
      success: true,
      userId: result.userId,
      requiresEmailVerification: true,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion (étape 1 → 2FA)',
    description:
      'Réponse HTTP 200. Succès : `twoFactorToken` à envoyer avec le code OTP vers POST /auth/2fa/verify.',
  })
  @ApiBody({ type: LoginRequestBodyDto })
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const result = await this.authService.login(body, extractClientIp(req));
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
        ...(result.field ? { field: result.field } : {}),
      });
    }
    return response.status(HttpStatus.OK).json({
      success: true,
      twoFactorToken: result.twoFactorToken,
    });
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vérification du code 2FA',
    description:
      'Réponse HTTP 200. Succès : cookie HttpOnly `pictures_at` (access token) ; ne pas stocker le jeton en JavaScript.',
  })
  @ApiBody({ type: VerifyTwoFactorRequestBodyDto })
  async verify2fa(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const result = await this.authService.verifyTwoFactor(
      body,
      extractClientIp(req),
    );
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
        ...(result.field ? { field: result.field } : {}),
      });
    }
    const accessToken = result.accessToken;
    response.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      accessTokenCookieOptions(ACCESS_TOKEN_TTL_MS),
    );
    return response.status(HttpStatus.OK).json({ success: true });
  }

  @Post('2fa/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renvoyer le code 2FA par email',
    description: 'Réponse HTTP 200.',
  })
  @ApiBody({ type: ResendTwoFactorRequestBodyDto })
  async resend2fa(@Body() body: unknown, @Res() response: Response) {
    const result = await this.authService.resendTwoFactor(body);
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
      });
    }
    return response.status(HttpStatus.OK).json({ success: true });
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Profil minimal (session)',
    description:
      'Cookie HttpOnly `pictures_at` et/ou header `Authorization: Bearer`. Réponse HTTP 200 ; échec auth via `success: false`.',
  })
  async me(
    @Headers('authorization') authorization: string | undefined,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const result = await this.authService.meFromBearer(
      authorization,
      req.headers.cookie,
    );
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
      });
    }
    return response.status(HttpStatus.OK).json({
      success: true,
      email: result.email,
      role: result.role,
    });
  }

  /** Toujours 200 : évite le bruit console navigateur sur fetch (404/4xx). Les échecs passent par `success: false`. */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmation de compte (lien email)',
    description: 'Réponse HTTP 200.',
  })
  @ApiBody({ type: ConfirmAccountRequestBodyDto })
  async confirm(@Body() body: unknown, @Res() response: Response) {
    const result = await this.authService.confirmAccount(body);
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
      });
    }
    return response.status(HttpStatus.OK).json({ success: true });
  }

  @Post('forgot-password/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demande de lien « mot de passe oublié »',
    description: 'Réponse HTTP 200 (message générique si email inconnu).',
  })
  @ApiBody({ type: ForgotPasswordRequestBodyDto })
  async forgotPasswordRequest(
    @Body() body: unknown,
    @Res() response: Response,
  ) {
    const result = await this.authService.forgotPasswordRequest(body);
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
      });
    }
    return response.status(HttpStatus.OK).json({
      success: true,
      message: result.message,
    });
  }

  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réinitialisation du mot de passe (jeton email)',
    description: 'Réponse HTTP 200.',
  })
  @ApiBody({ type: ForgotPasswordResetRequestBodyDto })
  async forgotPasswordReset(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const result = await this.authService.forgotPasswordReset(
      body,
      extractClientIp(req),
    );
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
        ...(result.field ? { field: result.field } : {}),
      });
    }
    return response.status(HttpStatus.OK).json({ success: true });
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changement de mot de passe (connecté)',
    description:
      'Cookie HttpOnly `pictures_at` et/ou header `Authorization: Bearer`. Réponse HTTP 200.',
  })
  @ApiBody({ type: ChangePasswordRequestBodyDto })
  async changePassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    const result = await this.authService.changePassword(
      body,
      authorization,
      extractClientIp(req),
      req.headers.cookie,
    );
    if (!result.ok) {
      return response.status(HttpStatus.OK).json({
        success: false,
        message: result.message,
        ...(result.field ? { field: result.field } : {}),
      });
    }
    return response.status(HttpStatus.OK).json({ success: true });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déconnexion',
    description:
      'Supprime le cookie HttpOnly `pictures_at`. Appeler depuis le client avec `credentials: include`.',
  })
  logout(@Res() response: Response) {
    clearAccessTokenCookie(response);
    return response.status(HttpStatus.OK).json({ success: true });
  }
}
