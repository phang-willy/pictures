import { Injectable } from '@nestjs/common';
import { OtpGeneratorPort } from '@/application/auth/ports/otp-generator.port';

@Injectable()
export class RandomOtpGeneratorAdapter implements OtpGeneratorPort {
  generate(length = 6): string {
    let out = '';
    for (let i = 0; i < length; i += 1) {
      out += Math.floor(Math.random() * 10).toString();
    }
    return out;
  }
}
