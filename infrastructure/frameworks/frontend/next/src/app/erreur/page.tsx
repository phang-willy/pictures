import type { Metadata } from "next";
import { HttpErrorView } from "@/components/http-error-view";
import { appName } from "@/config/app-name";

type PageProps = {
  searchParams: Promise<{ code?: string; message?: string }>;
};

function parseStatus(raw: string | undefined): number | null {
  if (raw === undefined || raw === "") {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 100 || n > 599) {
    return null;
  }
  return n;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const status = parseStatus(params.code) ?? 400;
  return {
    title: `${appName} - Erreur ${status}`,
    description: `${appName} - Erreur HTTP ${status}`,
  };
}

export default async function ErreurPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = parseStatus(params.code) ?? 400;
  const message = params.message?.trim() || undefined;

  return <HttpErrorView status={status} message={message} />;
}
