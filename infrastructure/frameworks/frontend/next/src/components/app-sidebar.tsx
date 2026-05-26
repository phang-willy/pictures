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
import { appName } from "@/config/app-name";
import Logo from "@/components/logo";

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
            title: 'Dashboard',
            url: '/admin',
          },
          {
            title: "Posts",
            url: "/admin/post",
          },
          {
            title: "Médiathèque",
            url: "/admin/image",
          },
          {
            title: "Pays",
            url: "/admin/country",
          },
          {
            title: "Villes",
            url: "/admin/city",
          },
        ],
      },
    ],
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between md:block">
          <Link href="/" className="block p-2.5">
            <Logo />
            <h1 className="sr-only">{appName}</h1>
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
                                isActive={
                                  pathname === subItem.url ||
                                  (subItem.url !== "/admin" &&
                                    pathname.startsWith(`${subItem.url}/`))
                                }
                              >
                                <Link href={subItem.url} title={subItem.title}>
                                  {subItem.title}
                                </Link>
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
            <SidebarMenuButton
              asChild
              variant="outline"
              isActive={
                pathname === "/profile" || pathname.startsWith("/profile/")
              }
            >
              <Link href="/profile" className="flex min-w-0 items-center gap-2">
                <User className="size-4 shrink-0" aria-hidden />
                <span className="truncate text-left text-sm">Profil</span>
              </Link>
            </SidebarMenuButton>
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
