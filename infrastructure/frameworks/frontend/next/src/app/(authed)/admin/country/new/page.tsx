import Link from "next/link";
import { cookies } from "next/headers";
import { serverFetchApiItems, toCookieHeader } from "@/lib/api";
import type { ContinentOption } from "@/types/country.types";
import { Button } from "@/components/ui/button";
import { CountryNewForm } from "./country-new-form";
import { ArrowLeftIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCountryNewPage() {
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const continents = await serverFetchApiItems<ContinentOption>(
    "/api/continent",
    cookieHeader,
  );

  return (
    <>
      <section className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/admin/country">
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Retour à la liste</span>
            </span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nouveau pays</h1>
      </section>

      <CountryNewForm continents={continents} />
    </>
  );
}
