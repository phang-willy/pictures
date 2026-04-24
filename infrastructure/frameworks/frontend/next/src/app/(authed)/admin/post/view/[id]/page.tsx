import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { serverFetchApiItem, toCookieHeader } from "@/lib/api";
import type { PostHttpDetail } from "@/types/admin-post.types";
import { formatDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CityPointMap } from "@/components/admin/city-point-map";
import { ContryFlag } from "@/components/admin/country-flag";

export const dynamic = "force-dynamic";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-2 last:border-0 sm:grid-cols-[minmax(8rem,14rem)_1fr] sm:gap-4">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word">{value}</dd>
    </div>
  );
}

export default async function AdminPostViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const post = await serverFetchApiItem<PostHttpDetail>(
    `/api/post/${encodeURIComponent(id)}`,
    cookieHeader,
  );
  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="outline" asChild>
          <Link href="/admin/post">
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Retour à la liste</span>
            </span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{post.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="ID" value={post.id} />
            <DetailRow
              label="Ville"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <ContryFlag
                    name={post.city.country.name}
                    iso2={post.city.country.iso2}
                    show_name={false}
                  />
                  <span className="text-muted-foreground">
                    ({post.city.country.iso2})
                  </span>
                  <span>{post.city.name}</span>
                </span>
              }
            />
            <DetailRow label="Nom" value={post.name} />
            <DetailRow label="Slug" value={post.slug} />
            <DetailRow
              label="Description"
              value={post.description?.trim() ? post.description : "-"}
            />
            <DetailRow label="Latitude" value={post.latitude.toFixed(6)} />
            <DetailRow label="Longitude" value={post.longitude.toFixed(6)} />
            <DetailRow
              label="Créé le"
              value={formatDate(post.createdAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Mis à jour le"
              value={formatDate(post.updatedAt, { mode: "date-hour" })}
            />
            <DetailRow
              label="Désactivé le"
              value={
                post.deactivatedAt
                  ? formatDate(post.deactivatedAt, { mode: "date-hour" })
                  : "-"
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carte 3D</CardTitle>
        </CardHeader>
        <CardContent>
          <CityPointMap
            latitude={post.latitude}
            longitude={post.longitude}
            ariaLabel={`Carte du post ${post.name}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
