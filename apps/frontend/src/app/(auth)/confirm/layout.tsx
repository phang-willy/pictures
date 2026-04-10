import type { Metadata } from "next";
import { appName } from "@/lib/app-name";

/** Titres détaillés (?type=account, etc.) : voir `page.tsx` → generateMetadata. */
export const metadata: Metadata = {
  title: "Confirmation",
  description: `Confirmation sur ${appName}`,
  openGraph: {
    title: `${appName} - Confirmation`,
    description: `Confirmation sur ${appName}`,
    type: "website",
  },
};

export default function ConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
