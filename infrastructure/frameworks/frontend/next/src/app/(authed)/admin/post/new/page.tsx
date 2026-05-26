import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeftIcon } from "lucide-react";
import { serverFetchAllActiveCities, toCookieHeader } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PostNewForm } from "./post-new-form";

export const dynamic = "force-dynamic";

export default async function AdminPostNewPage() {
  const jar = await cookies();
  const cookieHeader = toCookieHeader(jar.getAll());
  const cities = await serverFetchAllActiveCities(cookieHeader);

  return (
    <>
      <section className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/admin/post">
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span>Retour à la liste</span>
            </span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nouveau post</h1>
      </section>
      <PostNewForm cities={cities} />
    </>
  );
}
