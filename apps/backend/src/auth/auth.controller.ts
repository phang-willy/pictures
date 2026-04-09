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
import type { Request, Response } from 'express';
import { AuthService } from '@/auth/auth.service';
import { extractClientIp } from '@/auth/client-ip.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Toujours 200 : évite le bruit console sur fetch (4xx). */
  @Post('register')
  @HttpCode(HttpStatus.OK)
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
  async login(@Body() body: unknown, @Res() response: Response) {
    const result = await this.authService.login(body);
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
    return response.status(HttpStatus.OK).json({
      success: true,
      accessToken: result.accessToken,
    });
  }

  @Post('2fa/resend')
  @HttpCode(HttpStatus.OK)
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
  async me(
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ) {
    const result = await this.authService.meFromBearer(authorization);
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
}
