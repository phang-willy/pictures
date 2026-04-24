import { DomainError } from '@/shared/domain/domain-error';

export class PostSlugVo {
  public readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
      throw new DomainError(
        'POST_INVALID_SLUG',
        'Slug must be lowercase words separated by dashes.',
      );
    }
    this.value = normalized;
  }
}
