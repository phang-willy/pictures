import type { Metadata } from "next";
import Link from "next/link";
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
import { serverFetchAllActivePosts } from "@/lib/api";
import { singleCityUrl, singlePostURL } from "@/lib/custom-url";

export const metadata: Metadata = {
  title: `Publications`,
  description: `${appName} - Liste des publications`,
  openGraph: {
    title: `${appName} - Publications`,
    description: `${appName} - Liste des publications`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function PostPage() {
  const postsRaw = await serverFetchAllActivePosts(undefined);
  const posts = [...postsRaw].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );

  return (
    <>
      <section className="container mx-auto space-y-6 p-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Publications</h1>
          {posts.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {posts.length === 1
                ? "1 publication"
                : `${posts.length} publications`}
            </p>
          ) : null}
        </div>
      </section>
      <section className="container mx-auto space-y-6 p-4">
        {posts.length <= 0 ? (
          <p className="text-muted-foreground text-sm">Aucune publication trouvée.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug font-medium">
                      {post.name}
                    </CardTitle>
                    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs">
                      <Link
                        href={`/pays/${encodeURIComponent(post.city.country.slug.toLowerCase())}`}
                        className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
                      >
                        <CountryFlag
                          name={post.city.country.name}
                          iso2={post.city.country.iso2}
                          size="base"
                          className="text-muted-foreground"
                        />
                      </Link>
                      <span aria-hidden>·</span>
                      <Link
                        href={`/city/${encodeURIComponent(singleCityUrl(post.city))}`}
                        className="hover:text-foreground hover:underline"
                      >
                        {post.city.name}
                      </Link>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 flex-1">
                    <EmbedMapDynamic
                      latitude={post.latitude}
                      longitude={post.longitude}
                      ariaLabel={post.name}
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
        )}
      </section>
    </>
  );
}
