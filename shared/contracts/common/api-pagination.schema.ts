import { z } from "zod";

/** Métadonnées `pagination` renvoyées par le backend Nest (`toPagination`). */
export const apiPaginationSchema = z.object({
  current_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_prev: z.boolean(),
  has_next: z.boolean(),
});

export type ApiPagination = z.infer<typeof apiPaginationSchema>;
