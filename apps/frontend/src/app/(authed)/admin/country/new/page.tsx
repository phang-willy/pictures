import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CountryNewForm, type ContinentOption } from "./country-new-form";
import { ArrowLeftIcon } from "lucide-react";

export const dynamic = "force-dynamic";

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

export default async function AdminCountryNewPage() {
  const continents = await fetchContinents();

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
        <h1 className="text-2xl font-semibold">Nouveau pays</h1>
      </div>

      <CountryNewForm continents={continents} />
    </div>
  );
}
