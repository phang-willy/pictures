import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `${appName} - Inscription`,
  description: `Création de compte à ${appName}`,
  openGraph: {
    title: `${appName} - Inscription`,
    description: `Création de compte à ${appName}`,
    type: "website",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  if (process.env.REGISTER_ON !== "true") {
    notFound();
  }
  return children;
}
