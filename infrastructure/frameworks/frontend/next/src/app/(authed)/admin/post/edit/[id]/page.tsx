import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import {
  serverFetchApiItem,
  serverFetchAllActiveCities,
  toCookieHeader,
} from "@/lib/api";
import type { PostHttpDetail } from "@/types/post.types";
import { Button } from "@/components/ui/button";
import { PostEditForm } from "./post-edit-form";

export const dynamic = "force-dynamic";

export default async function AdminPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const [post, cities] = await Promise.all([
    serverFetchApiItem<PostHttpDetail>(
      `/api/post/${encodeURIComponent(id)}`,
      cookieHeader,
    ),
    serverFetchAllActiveCities(cookieHeader),
  ]);
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
        <h1 className="text-2xl font-semibold">Modifier : {post.name}</h1>
      </div>
      <PostEditForm post={post} cities={cities} />
    </div>
  );
}
