import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';

@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return success({ status: 'ok' });
  }
}
