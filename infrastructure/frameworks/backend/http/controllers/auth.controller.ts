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
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { LogoutUseCase } from '@/application/auth/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/application/auth/use-cases/refresh-session.use-case';
import { RequestPasswordResetUseCase } from '@/application/auth/use-cases/request-password-reset.use-case';
import { RequestTwoFactorUseCase } from '@/application/auth/use-cases/request-two-factor.use-case';
import { ResetPasswordUseCase } from '@/application/auth/use-cases/reset-password.use-case';
import { VerifyTwoFactorUseCase } from '@/application/auth/use-cases/verify-two-factor.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { ConfirmAccountUseCase } from '@/application/auth/use-cases/confirm-account.use-case';
import { ChangePasswordUseCase } from '@/application/auth/use-cases/change-password.use-case';
import { ACCESS_TOKEN_TTL_MS } from '@/infrastructure/frameworks/backend/http/auth/access-token-ttl.const';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  accessTokenCookieOptions,
  clearAccessTokenCookie,
} from '@/infrastructure/frameworks/backend/http/auth/auth-cookie.config';
import { extractClientIp } from '@/infrastructure/frameworks/backend/http/utils/client-ip.util';
import { failure, success } from '@/infrastructure/frameworks/backend/nest/response.presenter';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly requestTwoFactorUseCase: RequestTwoFactorUseCase,
    private readonly verifyTwoFactorUseCase: VerifyTwoFactorUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly confirmAccountUseCase: ConfirmAccountUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: unknown, @Req() req: any, @Res() response: any) {
    const result = (await this.registerUseCase.execute(body, extractClientIp(req))) as {
      ok: boolean;
      message?: string;
      userId?: string;
      field?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(
        failure({
          message: result.message,
          ...(result.field ? { field: result.field } : {}),
        }),
      );
    }
    return response.status(HttpStatus.OK).json({
      ...success(),
      userId: result.userId,
      requiresEmailVerification: true,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Req() req: any, @Res() response: any) {
    const result = (await this.loginUseCase.execute(body, extractClientIp(req))) as {
      ok: boolean;
      message?: string;
      field?: string;
      twoFactorToken?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(
        failure({
          message: result.message,
          ...(result.field ? { field: result.field } : {}),
        }),
      );
    }
    return response.status(HttpStatus.OK).json({
      ...success(),
      twoFactorToken: result.twoFactorToken,
    });
  }

  @Post('2fa/resend')
  @HttpCode(HttpStatus.OK)
  async requestTwoFactor(@Body() body: unknown, @Req() req: any, @Res() response: any) {
    const result = (await this.requestTwoFactorUseCase.execute(body, extractClientIp(req))) as {
      ok: boolean;
      message?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(failure({ message: result.message }));
    }
    return response.status(HttpStatus.OK).json(success());
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(
    @Body() body: unknown,
    @Req() req: any,
    @Res() response: any,
  ) {
    const result = (await this.verifyTwoFactorUseCase.execute(
      body,
      extractClientIp(req),
    )) as {
      ok: boolean;
      message?: string;
      field?: string;
      accessToken?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(
        failure({
          message: result.message,
          ...(result.field ? { field: result.field } : {}),
        }),
      );
    }
    if (result.accessToken) {
      response.cookie(
        ACCESS_TOKEN_COOKIE_NAME,
        result.accessToken,
        accessTokenCookieOptions(ACCESS_TOKEN_TTL_MS),
      );
    }
    return response.status(HttpStatus.OK).json(success());
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(
    @Headers('authorization') authorization: string | undefined,
    @Req() req: any,
    @Res() response: any,
  ) {
    const result = (await this.refreshSessionUseCase.execute(
      authorization,
      req.headers.cookie,
    )) as {
      ok: boolean;
      message?: string;
      email?: string;
      role?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(failure({ message: result.message }));
    }
    return response.status(HttpStatus.OK).json({
      ...success(),
      email: result.email,
      role: result.role,
    });
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() body: unknown, @Req() req: any, @Res() response: any) {
    const result = (await this.confirmAccountUseCase.execute(body, extractClientIp(req))) as {
      ok: boolean;
      message?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(failure({ message: result.message }));
    }
    return response.status(HttpStatus.OK).json(success());
  }

  @Post('forgot-password/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() body: unknown, @Req() req: any, @Res() response: any) {
    const result = (await this.requestPasswordResetUseCase.execute(body, extractClientIp(req))) as {
      ok: boolean;
      message?: string;
    };
    return response
      .status(HttpStatus.OK)
      .json(result.ok ? success({ message: result.message }) : failure({ message: result.message }));
  }

  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: unknown, @Req() req: any, @Res() response: any) {
    const result = (await this.resetPasswordUseCase.execute(
      body,
      extractClientIp(req),
    )) as {
      ok: boolean;
      message?: string;
      field?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(
        failure({
          message: result.message,
          ...(result.field ? { field: result.field } : {}),
        }),
      );
    }
    clearAccessTokenCookie(response);
    return response.status(HttpStatus.OK).json(success());
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
    @Req() req: any,
    @Res() response: any,
  ) {
    const result = (await this.changePasswordUseCase.execute(
      body,
      authorization,
      extractClientIp(req),
      req.headers.cookie,
    )) as {
      ok: boolean;
      message?: string;
      field?: string;
    };
    if (!result.ok) {
      return response.status(HttpStatus.OK).json(
        failure({
          message: result.message,
          ...(result.field ? { field: result.field } : {}),
        }),
      );
    }
    return response.status(HttpStatus.OK).json(success());
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() response: any) {
    this.logoutUseCase.execute();
    clearAccessTokenCookie(response);
    return response.status(HttpStatus.OK).json(success());
  }
}
