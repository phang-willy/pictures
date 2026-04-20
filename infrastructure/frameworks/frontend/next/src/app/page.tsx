import type { Metadata } from "next";
import { appName } from "@/config/app-name";
import { HomeMapShell } from "@/components/home-map-shell";
import { ModeToggle } from "@/components/toggle-theme";
import Link from "next/link";

export const metadata: Metadata = {
  title: `${appName} - Accueil`,
  description: `Page d'accueil de ${appName}`,
  openGraph: {
    title: `${appName} - Accueil`,
    description: `Page d'accueil de ${appName}`,
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="flex flex-col h-full w-full">
        <header className="w-full border-b">
          <div className="flex items-center justify-between p-4 mx-auto container">
            <Link href="/">
              <span className="text-2xl font-bold">{appName}</span>
            </Link>
            <ModeToggle />
          </div>
        </header>
        <main className="relative">
          <HomeMapShell />
        </main>
      </div>
    </div>
  );
}
