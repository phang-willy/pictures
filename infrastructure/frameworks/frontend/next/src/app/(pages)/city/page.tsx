import type { Metadata } from "next";
import Link from "next/link";
import { appName } from "@/config/app-name";
import { serverFetchAllActiveCities } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmbedMapDynamic } from "@/components/embed-map-dynamic";
import { CountryFlag } from "@/components/country-flag";
import { singleCityUrl } from "@/lib/custom-url";

export const metadata: Metadata = {
  title: `Villes`,
  description: `${appName} - Liste des villes`,
  openGraph: {
    title: `${appName} Villes`,
    description: `${appName} Liste des villes`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function VillePage() {
  const citiesRaw = await serverFetchAllActiveCities(undefined);
  const cities = [...citiesRaw].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );

  return (
    <>
      <section id="information" className="container mx-auto space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Villes</h1>
          {cities.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {cities.length === 1
                ? "1 ville"
                : `${cities.length} villes`}
            </p>
          ) : null}
        </div>
      </section>
      <section id="content" className="container mx-auto space-y-6 p-4">
        {cities.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {cities.map((city) => (
                <li key={city.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        <h2 className="font-medium text-xl">{city.name}</h2>
                        <CountryFlag name={city.country.name} iso2={city.country.iso2} size="base" className="text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <EmbedMapDynamic
                        latitude={city.latitude}
                        longitude={city.longitude}
                        ariaLabel={`${city.name}`}
                        from="city"
                      />
                    </CardContent>
                    <CardFooter>
                      <Link
                        href={`/city/${encodeURIComponent(singleCityUrl(city))}`}
                        className="hover:underline focus:underline"
                      >
                        En savoir plus sur {city.name}
                      </Link>
                    </CardFooter>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucune ville active.
            </p>
          )}
      </section>
    </>
  );
}
