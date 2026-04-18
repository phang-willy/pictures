import { DomainError } from '@/shared/domain/domain-error';

export class ContinentCodeVo {
  public readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toUpperCase();
    if (!/^[A-Z]{2,8}$/.test(normalized)) {
      throw new DomainError(
        'CONTINENT_INVALID_CODE',
        'Continent code must contain 2 to 8 uppercase letters.',
      );
    }
    this.value = normalized;
  }
}
