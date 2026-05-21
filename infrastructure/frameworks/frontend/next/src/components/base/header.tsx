"use client";

import { appName } from "@/config/app-name";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/toggle-theme";

const navItems = [
  {
    label: "Pays",
    href: "/country",
  },
  {
    label: "Villes",
    href: "/city",
  },
  {
    label: "Publications",
    href: "/post",
  }
];

export default function BaseHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky bottom-0 z-10000 w-full shrink-0 border-t bg-background xl:top-0 xl:bottom-auto xl:order-first xl:border-t-0 xl:border-b">
      <Link
        href="#content"
        className="pointer-events-none absolute top-4 left-4 z-10001 hidden -translate-y-24 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-md ring-1 ring-border transition-transform focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:block"
      >
        Aller au contenu
      </Link>
      <div className="container mx-auto flex items-center justify-between gap-4 p-4 xl:h-full">
        <div className="flex items-center gap-4">
          <Link href="/" className="block p-2">
            <Image
              src="/logo.webp"
              alt={`Logo - ${appName}`}
              width={16}
              height={16}
              className="h-4 w-4"
              loading="lazy"
            />
            <span className="sr-only">{appName}</span>
          </Link>
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`text-sm text-gray-500 hover:text-gray-700 focus:text-gray-700 ${active ? "font-bold" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}
