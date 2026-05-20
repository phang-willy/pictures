"use client";

import { usePathname } from "next/navigation";

import BaseBreadcrumb from "@/components/base/breadcrumb";
import { BreadcrumbLabelsProvider } from "@/components/base/breadcrumb-labels";
import BaseHeader from "@/components/base/header";
import { cn } from "@/lib/utils";

export function PagesStack({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <BreadcrumbLabelsProvider>
      <div
        className={cn(
          "flex w-full min-h-0 flex-col xl:overflow-visible",
          !isHome && "max-xl:h-dvh max-xl:overflow-hidden",
          isHome && "h-full",
          !isHome && "xl:h-auto",
          isHome && "xl:h-full",
        )}
      >
        <main
          className={cn(
            "relative min-h-0 flex-1 xl:pt-16",
            isHome && "overflow-hidden",
            !isHome &&
              "max-xl:overflow-y-auto max-xl:overflow-x-hidden xl:overflow-visible",
          )}
        >
          <BaseBreadcrumb />
          {children}
        </main>
        <BaseHeader />
      </div>
    </BreadcrumbLabelsProvider>
  );
}
