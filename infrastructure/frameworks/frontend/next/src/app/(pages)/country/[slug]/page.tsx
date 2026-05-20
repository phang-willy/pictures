import { CountryFlag } from "@/components/country-flag";
import { EmbedMapDynamic } from "@/components/embed-map-dynamic";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { appName } from "@/config/app-name";
import { serverFetchAllActiveCities, serverFetchApiItem } from "@/lib/api";
import type { CountryHttpDetail } from "@/types/country.types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { singleCityUrl } from "@/lib/custom-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = await serverFetchApiItem<CountryHttpDetail>(
    `/api/country/${encodeURIComponent(slug.trim())}`,
    undefined,
  );
  if (!country || country.deactivatedAt !== null) {
    return {
      title: `Pays`,
      description: `Page pays - ${appName}`,
      openGraph: {
        title: `${appName} - Pays`,
        description: `Page pays - ${appName}`,
        type: "website",
      },
    };
  }
  const description = `${appName} - En savoir plus sur ${country.name}`;
  const title = `Pays - ${country.name}`
  return {
    title,
    description,
    openGraph: {
      title: `${appName} - ${title}`,
      description,
      type: "website",
    },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const country = await serverFetchApiItem<CountryHttpDetail>(
    `/api/country/${encodeURIComponent(slug.trim())}?geometry=true`,
    undefined,
  );

  if (!country) {
    notFound();
  }

  if (country.deactivatedAt !== null) {
    notFound();
  }

  const cities = await serverFetchAllActiveCities(undefined, {
    countryId: country.id,
  });

  return (
    <div>
      <section id="information" className="container mx-auto space-y-6 p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6 lg:col-span-2 w-full">
            <EmbedMapDynamic
              from="country"
              countryGeometry={country.geometry}
              ariaLabel={`Carte - ${country.name}`}
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              <CountryFlag name={country.name} iso2={country.iso2} size="base" show_name={false} />
            </h1>
            <div>
              <p className="font-bold">
                <span>
                  {country.name}
                </span>
              </p>
              <p className="text-muted-foreground text-sm">
                <span>
                  {country.continent.name}
                </span>
              </p>
              <p className="text-muted-foreground text-sm">
                <span>
                  {country.iso3}
                </span>
              </p>
              <p className="text-muted-foreground text-sm">
                <span>
                  {country.iso2}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="content" className="container mx-auto space-y-6 p-4">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Villes : {cities.length}
          </h2>
          {cities.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {cities.map((city) => (
                <li key={city.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{city.name}</CardTitle>
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
              Aucune ville active pour ce pays.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
