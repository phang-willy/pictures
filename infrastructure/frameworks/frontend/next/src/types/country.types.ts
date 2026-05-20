export type { CountryHttpDetail } from "@/domain/country/types/country-http.detail";

export type ContinentOption = { id: string; code: string; name: string };

/** Élément renvoyé par `GET /api/country` (liste paginée). */
export type CountryListHttpItem = {
  id: string;
  name: string;
  iso2: string;
  iso3: string | null;
  slug: string;
  continent: {
    id: string;
    code: string;
    name: string;
  };
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Présent si la requête inclut `geometry=true`. */
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinate: unknown;
  } | null;
};
