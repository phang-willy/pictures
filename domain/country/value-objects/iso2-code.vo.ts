import { DomainError } from '@/shared/domain/domain-error';

export class Iso2CodeVo {
  public readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) {
      throw new DomainError('COUNTRY_INVALID_ISO2', 'ISO2 must contain 2 letters.');
    }
    this.value = normalized;
  }
}
