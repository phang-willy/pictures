import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  ADMIN_PATHNAME_HEADER,
  buildAdminMetadataAsync,
} from "@/lib/admin-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get(ADMIN_PATHNAME_HEADER) ?? "/admin";
  return buildAdminMetadataAsync(pathname);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="container mx-auto p-4">{children}</div>;
}
