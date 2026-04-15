"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { LogOutIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthed } from "@/app/(authed)/authed-provider";
import { appName } from "@/lib/app-name";

export function AppSidebar() {
  const { logout, user } = useAuthed();
  const { isMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold">{appName}</h1>
          </Link>
          {isMobile ? <SidebarTrigger /> : null}
        </div>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>
        <div className="flex flex-col gap-2">
          {user ? (
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/profile" className="flex min-w-0 items-center gap-2">
                <User className="size-4 shrink-0" aria-hidden />
                <span className="truncate text-left text-sm">Profil</span>
              </Link>
            </Button>
          ) : null}
          <Button
            variant="destructive"
            onClick={logout}
            aria-label="Se déconnecter"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Se déconnecter</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
