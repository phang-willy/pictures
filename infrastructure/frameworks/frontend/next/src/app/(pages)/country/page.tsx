import { CountriesByContinentAccordion } from "@/components/countries-by-continent-accordion";
import { appName } from "@/config/app-name";
import { serverFetchAllCountries } from "@/lib/api";
import type { CountryListHttpItem } from "@/types/country.types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Pays`,
  description: `${appName} - Liste des pays`,
  openGraph: {
    title: `${appName} - Pays`,
    description: `${appName} - Liste des pays`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";

function groupCountriesByContinentAsc(countries: CountryListHttpItem[]) {
  const map = new Map<
    string,
    { continentId: string; continentName: string; items: CountryListHttpItem[] }
  >();

  for (const country of countries) {
    const continentId = country.continent.id;
    let bucket = map.get(continentId);
    if (!bucket) {
      bucket = {
        continentId,
        continentName: country.continent.name,
        items: [],
      };
      map.set(continentId, bucket);
    }
    bucket.items.push(country);
  }

  return Array.from(map.values())
    .map((bucket) => ({
      continentId: bucket.continentId,
      continentName: bucket.continentName,
      countries: [...bucket.items].sort((a, b) =>
        a.name.localeCompare(b.name, "fr"),
      ),
    }))
    .sort((a, b) =>
      a.continentName.localeCompare(b.continentName, "fr"),
    );
}

export default async function CountryPage() {
  const countriesRaw = await serverFetchAllCountries(undefined, {
    geometry: true,
  });
  const countries = countriesRaw.filter((c) => c.deactivatedAt == null);

  const groups = groupCountriesByContinentAsc(countries);
  return (
    <>
      <section className="container mx-auto space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pays</h1>
          {countries.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {countries.length === 1
                ? "1 pays"
                : `${countries.length} pays`}
            </p>
          ) : null}
        </div>
      </section>
      {groups.length > 0 ? (
        <CountriesByContinentAccordion groups={groups} />
      ) : null}
    </>
  );
}
