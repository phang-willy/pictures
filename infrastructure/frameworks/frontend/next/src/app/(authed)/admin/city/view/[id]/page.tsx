import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { serverFetchApiItem, toCookieHeader } from "@/lib/api";
import type { CityHttpDetail } from "@/types/admin-city.types";
import { formatDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CityPointMap } from "@/components/admin/city-point-map";
import { ContryFlag } from "@/components/admin/country-flag";

export const dynamic = "force-dynamic";

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

export default async function AdminCityViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const city = await serverFetchApiItem<CityHttpDetail>(
    `/api/city/${encodeURIComponent(id)}`,
    cookieHeader,
  );
  if (!city) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="outline" asChild>
          <Link href="/admin/city">
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Retour à la liste</span>
            </span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{city.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="ID" value={city.id} />
            <DetailRow
              label="Pays"
              value={
                <ContryFlag name={city.country.name} iso2={city.country.iso2} />
              }
            />
            <DetailRow label="Nom" value={city.name} />
            <DetailRow label="Slug" value={city.slug} />
            <DetailRow label="Latitude" value={city.latitude.toFixed(6)} />
            <DetailRow label="Longitude" value={city.longitude.toFixed(6)} />
            <DetailRow
              label="Créé le"
              value={formatDate(city.createdAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Mis à jour le"
              value={formatDate(city.updatedAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Désactivé le"
              value={
                city.desactivatedAt
                  ? formatDate(city.desactivatedAt, { mode: "date-hour" })
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
          <CityPointMap
            latitude={city.latitude}
            longitude={city.longitude}
            ariaLabel={`Carte de la ville ${city.name}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
