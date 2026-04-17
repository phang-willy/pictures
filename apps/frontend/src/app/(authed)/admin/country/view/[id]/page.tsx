import Link from "next/link";
import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { formatDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminGeometryMap,
  type AdminGeometryPayload,
} from "@/components/admin/admin-geometry-map";
import { CountryNameWithFlag } from "@/components/admin/country-name-with-flag";
import { ArrowLeftIcon } from "lucide-react";

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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-2 last:border-0 sm:grid-cols-[minmax(8rem,14rem)_1fr] sm:gap-4">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word">{value}</dd>
    </div>
  );
}

export default async function AdminCountryViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const country = await fetchCountry(id);
  if (!country) {
    notFound();
  }

  const continentLabel = `${country.continent.name} (${country.continent.code})`;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="outline" asChild>
          <Link href="/admin/country">
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Retour à la liste</span>
            </span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{country.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="ID" value={country.id} />
            <DetailRow label="Continent" value={continentLabel} />
            <DetailRow
              label="Nom"
              value={
                <CountryNameWithFlag
                  name={country.name}
                  codeIso2={country.codeIso2}
                />
              }
            />
            <DetailRow label="Slug" value={country.slug} />
            <DetailRow label="ISO 2" value={country.codeIso2} />
            <DetailRow label="ISO 3" value={country.codeIso3 ?? "-"} />
            <DetailRow
              label="Créé le"
              value={formatDate(country.createdAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Mis à jour le"
              value={formatDate(country.updatedAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Supprimé le"
              value={
                country.deletedAt
                  ? formatDate(country.deletedAt, { mode: "date-hour" })
                  : "-"
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carte</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminGeometryMap
            instanceId={country.id}
            geometry={country.geometry}
            ariaLabel={`Carte du pays ${country.name}`}
            featureProperties={{ countryId: country.id, name: country.name }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
