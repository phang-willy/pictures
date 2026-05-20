import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbLabelOverride } from "@/components/base/breadcrumb-labels";
import { CountryFlag } from "@/components/country-flag";
import { EmbedMapDynamic } from "@/components/embed-map-dynamic";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appName } from "@/config/app-name";
import {
  serverFetchAllActiveCities,
  serverFetchAllActivePosts,
} from "@/lib/api";
import { singleCityUrl, singlePostURL } from "@/lib/custom-url";
import type { CityHttpDetail } from "@/types/city.types";

export const dynamic = "force-dynamic";

const getActiveCitiesCatalog = cache(async () =>
  serverFetchAllActiveCities(undefined),
);

async function resolveCityBySlug(slugRaw: string): Promise<CityHttpDetail | null> {
  const slug = decodeURIComponent(slugRaw.trim()).toLowerCase();
  if (!slug) {
    return null;
  }
  const cities = await getActiveCitiesCatalog();
  return cities.find((city) => singleCityUrl(city) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await resolveCityBySlug(slug);
  if (!city) {
    return {
      title: `Villes`,
      description: `Page ville - ${appName}`,
      openGraph: {
        title: `${appName} - Villes`,
        description: `Page ville - ${appName}`,
        type: "website",
      },
    };
  }
  const description = `${appName} - ${city.country.name} - En savoir plus sur ${city.name}`;
  return {
    title: `Villes - ${city.name}`,
    description,
    openGraph: {
      title: `${appName} - Villes - ${city.name}`,
      description,
      type: "website",
    },
  };
}

export default async function VilleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = await resolveCityBySlug(slug);
  if (!city) {
    notFound();
  }

  const posts = await serverFetchAllActivePosts(undefined, {
    cityId: city.id,
  });

  return (
    <div>
      <BreadcrumbLabelOverride
        href={`/city/${encodeURIComponent(singleCityUrl(city))}`}
        label={city.name}
      />
      <section id="information" className="container mx-auto space-y-6 p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6 lg:col-span-2 w-full">
            <EmbedMapDynamic
              latitude={city.latitude}
              longitude={city.longitude}
              ariaLabel={`Carte - ${city.name}`}
              from="city"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{city.name}</h1>
            <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Link
                href={`/country/${encodeURIComponent(city.country.slug.toLowerCase())}`}
                className="hover:text-foreground hover:underline focus:text-foreground focus:underline"
              >
                <CountryFlag
                  name={city.country.name}
                  iso2={city.country.iso2}
                  size="base"
                  className="w-auto"
                />
              </Link>
            </p>
          </div>
        </div>
      </section>
      <section id="content" className="container mx-auto space-y-6 p-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Publications : {posts.length}
        </h2>
        {posts.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{post.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 flex-1">
                    <EmbedMapDynamic
                      latitude={post.latitude}
                      longitude={post.longitude}
                      ariaLabel={`${post.name}`}
                      from="city"
                      showMarker
                    />
                    <p className="text-muted-foreground">
                      {post.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/post/${encodeURIComponent(singlePostURL(post))}`}
                      className="hover:underline focus:underline"
                    >
                      En savoir plus sur {post.name}
                    </Link>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Aucun post actif pour cette ville.
          </p>
        )}
      </section>
    </div>
  );
}
