export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 50;
export const MAX_PER_PAGE = 100;

export function toPagination(page: number, perPage: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  return {
    current_page: currentPage,
    per_page: perPage,
    total,
    total_pages: totalPages,
    has_prev: currentPage > 1,
    has_next: currentPage < totalPages,
  };
}

export function parsePage(value?: string): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PAGE;
  }
  return parsed;
}

export function parsePerPage(value?: string): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PER_PAGE;
  }
  return Math.min(parsed, MAX_PER_PAGE);
}
