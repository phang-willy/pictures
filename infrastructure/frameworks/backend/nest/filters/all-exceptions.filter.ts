import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => {
        json: (body: unknown) => void;
      };
    }>();

    if (exception instanceof DomainError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: exception.code,
        message: exception.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      response.status(status).json(payload);
      return;
    }

    // Log des erreurs non-http pour faciliter le debug en dev/container.
    // eslint-disable-next-line no-console
    console.error('[AllExceptionsFilter] Unhandled exception:', exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
