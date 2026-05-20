"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function PagesRootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className={cn(
        "relative w-full",
        isHome
          ? "h-dvh overflow-hidden"
          : // overflow-x sur tout le viewport casse `sticky` / confinement scroll ; seulement < xl où on en a besoin
            "min-h-dvh max-xl:overflow-x-hidden xl:overflow-visible",
      )}
    >
      {children}
    </div>
  );
}
