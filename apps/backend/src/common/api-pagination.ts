/** Taille de page fixe pour toutes les réponses paginées. */
export const API_PER_PAGE = 20 as const;

export type ApiPagination = {
  current_page: number;
  total_page: number;
  per_page: typeof API_PER_PAGE;
};

export type PaginatedBody<T> = {
  data: T[];
  pagination: ApiPagination;
};

export function totalPages(totalItems: number): number {
  if (totalItems <= 0) {
    return 0;
  }
  return Math.ceil(totalItems / API_PER_PAGE);
}

export function paginatedBody<T>(
  data: T[],
  currentPage: number,
  totalItems: number,
): PaginatedBody<T> {
  const safePage =
    Number.isFinite(currentPage) && currentPage >= 1
      ? Math.floor(currentPage)
      : 1;
  return {
    data,
    pagination: {
      current_page: safePage,
      total_page: totalPages(totalItems),
      per_page: API_PER_PAGE,
    },
  };
}
