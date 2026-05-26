import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthedProvider } from "@/app/(authed)/authed-provider";
import { ModeToggle } from "@/components/toggle-theme";
import { appName } from "@/config/app-name";

export const metadata: Metadata = {
  title: "Espace membre",
  description: `Espace connecté de ${appName}`,
  openGraph: {
    title: `${appName} - Espace membre`,
    description: `Espace connecté de ${appName}`,
    type: "website",
  },
};

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthedProvider>
      <SidebarProvider>
        <AppSidebar />
        <div id="container" className="relative flex h-full min-w-0 flex-1 flex-col">
          <header className="sticky top-0 right-0 left-0 w-full shrink-0 border-b bg-white dark:bg-black">
            <div className="flex items-center justify-between p-4 container mx-auto">
              <SidebarTrigger />
              <ModeToggle />
            </div>
          </header>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </SidebarProvider>
    </AuthedProvider>
  );
}
