import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import {
  serverFetchApiItem,
  serverFetchApiItems,
  toCookieHeader,
} from "@/lib/api";
import type { CityHttpDetail } from "@/types/city.types.ts";
import type { CountryHttpDetail } from "@/types/country.types";
import { Button } from "@/components/ui/button";
import { CityEditForm } from "./city-edit-form";

export const dynamic = "force-dynamic";

type CountryOption = Pick<
  CountryHttpDetail,
  "id" | "name" | "iso2" | "geometry"
>;

export default async function AdminCityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const [city, countries] = await Promise.all([
    serverFetchApiItem<CityHttpDetail>(
      `/api/city/${encodeURIComponent(id)}`,
      cookieHeader,
    ),
    serverFetchApiItems<CountryOption>(
      "/api/country?geometry=true",
      cookieHeader,
    ),
  ]);
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
        <h1 className="text-2xl font-semibold">Modifier : {city.name}</h1>
      </div>
      <CityEditForm city={city} countries={countries} />
    </div>
  );
}
