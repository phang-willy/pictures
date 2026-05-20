import type { Metadata } from "next";
import { HomeMapShell } from "@/components/home-map-shell";
import { appName } from "@/config/app-name";

export const metadata: Metadata = {
  title: `Accueil`,
  description: `Page d'accueil de ${appName}`,
  openGraph: {
    title: `Accueil`,
    description: `Page d'accueil de ${appName}`,
    type: "website",
  },
};

export default function Home() {
  return (
    <HomeMapShell />
  );
}
