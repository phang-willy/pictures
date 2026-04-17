import { z } from "zod";

const continentNameOnlySchema = z.object({
  name: z.string(),
});

/**
 * Élément de la liste renvoyée par `GET /api/country`
 * (admin + carte ; dates sérialisées en ISO côté JSON).
 */
export const countryListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  codeIso2: z.string(),
  codeIso3: z.string().nullable(),
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

/** Alias pratique pour les tableaux / écrans admin. */
export type CountryRow = CountryListItem;

/**
 * Valide une réponse JSON liste pays (tolère les lignes invalides).
 */
export function parseCountryListItems(data: unknown): CountryListItem[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const out: CountryListItem[] = [];
  for (const item of data) {
    const parsed = countryListItemSchema.safeParse(item);
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return out;
}
