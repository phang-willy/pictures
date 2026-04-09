import type { Metadata } from "next";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: "Home",
  description: `Page d'accueil de ${appName}`,
  openGraph: {
    title: `${appName} - Home`,
    description: `Page d'accueil de ${appName}`,
    type: "website",
  },
};

export default function Home() {
  return (
    <main>
      <h1 className="text-7xl font-bold underline">Hello World</h1>
      <p>This is a test</p>
    </main>
  );
}
