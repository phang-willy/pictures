import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmPageClient } from "@/app/(auth)/confirm/confirm-page-client";
import { appName } from "@/config/app-name";

type PageProps = {
  searchParams: Promise<{ type?: string; token?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const isAccount = params.type === "account";
  const titleSegment = isAccount ? "Confirmation du compte" : "Confirmation";
  const description = isAccount
    ? `Confirmation du compte sur ${appName}`
    : `Confirmation sur ${appName}`;

  return {
    title: titleSegment,
    description,
    openGraph: {
      title: `${appName} - ${titleSegment}`,
      description,
      type: "website",
    },
  };
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPageClient />
    </Suspense>
  );
}
