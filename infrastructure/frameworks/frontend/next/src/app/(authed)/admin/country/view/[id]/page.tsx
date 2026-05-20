import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { serverFetchApiItem, toCookieHeader } from "@/lib/api";
import type { CountryHttpDetail } from "@/types/country.types";
import { formatDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGeometryMap } from "@/components/admin/admin-geometry-map";
import { CountryFlag } from "@/components/country-flag";
import { ArrowLeftIcon } from "lucide-react";
import { DetailRow } from "@/components/admin/detail-row";

export const dynamic = "force-dynamic";

export default async function AdminCountryViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const country = await serverFetchApiItem<CountryHttpDetail>(
    `/api/country/${encodeURIComponent(id)}?geometry=true`,
    cookieHeader,
  );
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
              value={<CountryFlag name={country.name} iso2={country.iso2} />}
            />
            <DetailRow label="Slug" value={country.slug} />
            <DetailRow label="ISO 2" value={country.iso2} />
            <DetailRow label="ISO 3" value={country.iso3 ?? "-"} />
            <DetailRow
              label="Créé le"
              value={formatDate(country.createdAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Mis à jour le"
              value={formatDate(country.updatedAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Désactivé le"
              value={
                country.deactivatedAt
                  ? formatDate(country.deactivatedAt, { mode: "date-hour" })
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
