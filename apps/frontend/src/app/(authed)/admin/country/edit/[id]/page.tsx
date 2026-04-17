import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { AdminGeometryPayload } from "@/components/admin/admin-geometry-map";
import {
  CountryEditForm,
  type ContinentOption,
  type CountryEditInitial,
} from "./country-edit-form";
import { ArrowLeftIcon } from "lucide-react";
import { CountryNameWithFlag } from "@/components/admin/country-name-with-flag";

export type CountryDetailResponse = {
  id: string;
  continentId: string;
  name: string;
  codeIso2: string;
  codeIso3: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  continent: {
    code: string;
    name: string;
  };
  geometry: AdminGeometryPayload;
};

export const dynamic = "force-dynamic";

async function fetchCountry(id: string): Promise<CountryDetailResponse | null> {
  const url = apiUrl(`/api/country/${encodeURIComponent(id)}`);
  const response = await fetch(url, { cache: "no-store" }).catch(
    (cause: unknown) => {
      throw new Error(
        `Impossible de joindre l'API (${url}). Vérifiez que le backend tourne, ou définissez API_URL pour le rendu serveur (Docker, etc.).`,
        { cause },
      );
    },
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`L'API pays a répondu ${response.status} pour ${url}.`);
  }
  return (await response.json()) as CountryDetailResponse;
}

async function fetchContinents(): Promise<ContinentOption[]> {
  const url = apiUrl("/api/country/continents");
  const response = await fetch(url, { cache: "no-store" }).catch(
    (cause: unknown) => {
      throw new Error(
        `Impossible de joindre l'API (${url}). Vérifiez que le backend tourne, ou définissez API_URL pour le rendu serveur (Docker, etc.).`,
        { cause },
      );
    },
  );
  if (!response.ok) {
    throw new Error(
      `L'API continents a répondu ${response.status} pour ${url}.`,
    );
  }
  return (await response.json()) as ContinentOption[];
}

export default async function AdminCountryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [country, continents] = await Promise.all([
    fetchCountry(id),
    fetchContinents(),
  ]);
  if (!country) {
    notFound();
  }

  const initial: CountryEditInitial = {
    id: country.id,
    continentId: country.continentId,
    name: country.name,
    codeIso2: country.codeIso2,
    codeIso3: country.codeIso3,
    slug: country.slug,
    geometry: country.geometry,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/admin/country">
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Retour à la liste</span>
            </span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          Modifier :{" "}
          <CountryNameWithFlag
            name={country.name}
            codeIso2={country.codeIso2}
          />
        </h1>
      </div>

      <CountryEditForm country={initial} continents={continents} />
    </div>
  );
}
