import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CountryFlag } from "@/components/country-flag";
import { PostContentHtml } from "@/components/admin/post-content-html";
import { appName } from "@/config/app-name";
import { singleCityUrl } from "@/lib/custom-url";
import { resolveActivePublicPostFromUriSegment } from "@/lib/resolve-public-post-from-uri";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveActivePublicPostFromUriSegment(slug);

  if (!resolved) {
    return {
      title: `${appName} - Publication`,
      description: `Publication - ${appName}`,
      openGraph: {
        title: `${appName} - Publication`,
        description: `Publication - ${appName}`,
        type: "website",
      },
    };
  }

  const { post, city } = resolved;
  const fallbackMeta = `${appName} - Publications - ${city.country.name} - ${city.name} - ${post.name}`;
  const metaDescription = post.description?.trim() || fallbackMeta;
  const title = fallbackMeta
  return {
    title,
    description: metaDescription,
    openGraph: {
      title,
      description: metaDescription,
      type: "website",
    },
  };
}
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = await resolveActivePublicPostFromUriSegment(slug);
  if (!resolved) {
    notFound();
  }

  const { post, city } = resolved;

  return (
    <>
      <section id="information" className="container mx-auto space-y-6 p-4">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight leading-tight capitalize">{post.name}</h1>
          <div className="text-muted-foreground text-sm">
            <p>
              <Link
                href={`/pays/${encodeURIComponent(city.country.slug.toLowerCase())}`}
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
            <p>
              <Link
                href={`/city/${encodeURIComponent(singleCityUrl(city))}`}
                className="hover:text-foreground hover:underline focus:text-foreground focus:underline"
              >
                {city.name}
              </Link>
            </p>
          </div>
        </div>
      </section>
      {post.description?.trim() ? (
        <section id="description" className="container mx-auto space-y-6 p-4">
          <h2 className="text-3xl font-bold tracking-tight">À propos</h2>
          <p className="text-muted-foreground max-w-3xl prose prose-sm leading-relaxed whitespace-pre-wrap">
            {post.description}
          </p>
        </section>
      ) : null}
      {post.content?.trim() ? (
        <section id="content" className="container mx-auto space-y-6 p-4">
          <h2 className="text-3xl font-bold tracking-tight">Un peu plus</h2>
          <PostContentHtml
            html={post.content}
          />
        </section>
      ) : null}
    </>
  );
}
