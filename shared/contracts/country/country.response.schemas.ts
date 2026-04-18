import { z } from "zod";
import {
  apiPaginationSchema,
  type ApiPagination,
} from "../common/api-pagination.schema";

const continentNameOnlySchema = z.object({
  name: z.string(),
});

/**
 * Element de la liste renvoyee par `GET /api/country`
 * (admin + carte ; dates serialisees en ISO cote JSON).
 */
export const countryListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  iso2: z.string(),
  iso3: z.string().nullable(),
  continent: continentNameOnlySchema.nullable().optional(),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  geometry: z
    .object({
      type: z.string(),
      coordinate: z.unknown(),
    })
    .nullable()
    .optional(),
});

export type CountryListItem = z.infer<typeof countryListItemSchema>;

/** Alias pratique pour les tableaux / ecrans admin. */
export type CountryRow = CountryListItem;

/**
 * Valide une reponse JSON liste pays (tolere les lignes invalides).
 */
export function parseCountryListItems(data: unknown): CountryListItem[] {
  const rawItems =
    Array.isArray(data)
      ? data
      : data &&
          typeof data === "object" &&
          "items" in data &&
          Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : null;
  if (!rawItems) {
    return [];
  }
  const out: CountryListItem[] = [];
  for (const item of rawItems) {
    const normalizedItem =
      item && typeof item === "object"
        ? {
            ...(item as Record<string, unknown>),
            iso2: (item as { iso2?: unknown }).iso2,
            iso3: (item as { iso3?: unknown }).iso3,
          }
        : item;
    const parsed = countryListItemSchema.safeParse(normalizedItem);
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return out;
}

/**
 * Liste pays + pagination (réponses `GET /api/country` paginées).
 */
export function parsePaginatedCountryListResponse(data: unknown): {
  items: CountryListItem[];
  pagination: ApiPagination | null;
} {
  const items = parseCountryListItems(data);
  const paginationRaw =
    data &&
    typeof data === "object" &&
    "pagination" in data
      ? (data as { pagination?: unknown }).pagination
      : undefined;
  const parsed = apiPaginationSchema.safeParse(paginationRaw);
  return {
    items,
    pagination: parsed.success ? parsed.data : null,
  };
}

