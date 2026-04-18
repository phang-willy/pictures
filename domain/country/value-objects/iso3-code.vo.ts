import { DomainError } from '@/shared/domain/domain-error';

export class Iso3CodeVo {
  public readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new DomainError('COUNTRY_INVALID_ISO3', 'ISO3 must contain 3 letters.');
    }
    this.value = normalized;
  }
}
