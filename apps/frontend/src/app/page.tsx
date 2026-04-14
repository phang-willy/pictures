import type { Metadata } from "next";
import { appName } from "@/lib/app-name";
import { HomeMapShell } from "@/app/home-map-shell";
import { SidebarProvider, SidebarTrigger } from "src/components/ui/sidebar";
import { MainSidebar } from "@/components/main-sidebar";
import { ModeToggle } from "@/components/toggle-theme";

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
      <SidebarProvider>
        <MainSidebar />
        <div className="flex flex-col h-full w-full">
          <header className="w-full border-b">
            <div className="flex items-center justify-between p-4">
              <SidebarTrigger />
              <ModeToggle />
            </div>
          </header>
          <main>
            <HomeMapShell />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
