"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOutIcon, SettingsIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthed } from "@/app/(authed)/authed-provider";
import { appName } from "@/lib/app-name";

export function AppSidebar() {
  const { logout, user, isAdmin } = useAuthed();
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const data = {
    navAdmin: [
      {
        title: "Administration",
        url: "/admin",
        icon: SettingsIcon,
        items: [
          {
            title: "Pays",
            url: "/admin/country",
          },
        ],
      },
    ],
  };

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
      <SidebarContent>
        {isAdmin
          ? data.navAdmin.map((item) => (
              <Collapsible
                key={item.title}
                title={item.title}
                defaultOpen
                className="group/collapsible"
              >
                <SidebarGroup>
                  <SidebarGroupLabel
                    asChild
                    className="flex items-center gap-2 group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <CollapsibleTrigger className="cursor-pointer">
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="text-sm font-medium">{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <a href={subItem.url}>{subItem.title}</a>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ))
          : null}
      </SidebarContent>
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
