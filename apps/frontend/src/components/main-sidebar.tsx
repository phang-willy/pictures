"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/auth-session";
import { appName } from "@/lib/app-name";
import Link from "next/link";
import { User } from "lucide-react";

export function MainSidebar() {
  const { isMobile } = useSidebar();
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(Boolean(getAccessToken()));
  }, []);

  return (
    <Sidebar className="bg-background">
      <SidebarHeader className="bg-background p-4 border-b">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold">{appName}</h1>
          </Link>
          {isMobile ? <SidebarTrigger /> : null}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-background" />
      <SidebarFooter className="bg-background">
        {isConnected ? (
          <div className="flex items-center justify-between p-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/profile" className="flex min-w-0 items-center gap-2">
                <User className="size-4 shrink-0" aria-hidden />
                <span className="truncate text-left text-sm">Profil</span>
              </Link>
            </Button>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
