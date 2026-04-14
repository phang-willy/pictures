"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { appName } from "@/lib/app-name";

export function MainSidebar() {
  const { isMobile } = useSidebar();

  return (
    <Sidebar className="bg-background">
      <SidebarHeader className="bg-background p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{appName}</h1>
          {isMobile ? <SidebarTrigger /> : null}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-background" />
      <SidebarFooter className="bg-background" />
    </Sidebar>
  );
}
