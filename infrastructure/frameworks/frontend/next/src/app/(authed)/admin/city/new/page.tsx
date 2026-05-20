import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeftIcon } from "lucide-react";
import { serverFetchApiItems, toCookieHeader } from "@/lib/api";
import type { CountryHttpDetail } from "@/types/country.types";
import { Button } from "@/components/ui/button";
import { CityNewForm } from "./city-new-form";

export const dynamic = "force-dynamic";

type CountryOption = Pick<
  CountryHttpDetail,
  "id" | "name" | "iso2" | "geometry"
>;

export default async function AdminCityNewPage() {
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const countries = await serverFetchApiItems<CountryOption>(
    "/api/country?geometry=true",
    cookieHeader,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/admin/city">
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Retour à la liste</span>
            </span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nouvelle ville</h1>
      </div>
      <CityNewForm countries={countries} />
    </div>
  );
}
