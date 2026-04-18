import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export function toHttpError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      throw new NotFoundException(error.message);
    }
    if (error.message.includes('already exists')) {
      throw new ConflictException(error.message);
    }
    throw new BadRequestException(error.message);
  }
  throw new BadRequestException('Unexpected error.');
}
