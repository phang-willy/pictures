import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthedProvider } from "@/app/(authed)/authed-provider";
import { ModeToggle } from "@/components/toggle-theme";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthedProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col h-full w-full">
          <header className="w-full border-b">
            <div className="flex items-center justify-between p-4 container mx-auto">
              <SidebarTrigger />
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuthedProvider>
  );
}