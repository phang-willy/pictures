import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  serverFetchApiItem,
  serverFetchApiItems,
  toCookieHeader,
} from "@/lib/api";
import type {
  ContinentOption,
  CountryHttpDetail,
} from "@/types/admin-country.types";
import { Button } from "@/components/ui/button";
import { CountryEditForm } from "./country-edit-form";
import { ArrowLeftIcon } from "lucide-react";
import { ContryFlag } from "@/components/admin/country-flag";
export const dynamic = "force-dynamic";

export default async function AdminCountryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const [country, continents] = await Promise.all([
    serverFetchApiItem<CountryHttpDetail>(
      `/api/country/${encodeURIComponent(id)}?geometry=true`,
      cookieHeader,
    ),
    serverFetchApiItems<ContinentOption>("/api/continent", cookieHeader),
  ]);
  if (!country) {
    notFound();
  }

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
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          Modifier : <ContryFlag name={country.name} iso2={country.iso2} />
        </h1>
      </div>
      <CountryEditForm country={country} continents={continents} />{" "}
    </div>
  );
}
