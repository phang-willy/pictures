"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbLabels } from "@/components/base/breadcrumb-labels";
import { cn } from "@/lib/utils";

const segmentLabelOverrides: Record<string, string> = {
  post: "Publications",
  country: 'Pays',
  city: 'Villes'
};

function formatSegmentLabel(segment: string): string {
  try {
    const decoded = decodeURIComponent(segment);
    const override = segmentLabelOverrides[decoded.toLowerCase()];
    if (override) {
      return override;
    }

    return decoded
      .replace(/[-_]+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return segment;
  }
}

type BaseBreadcrumbProps = {
  className?: string;
  homeHref?: string;
  homeLabel?: string;
};

export default function BaseBreadcrumb({
  className,
  homeHref = "/",
  homeLabel = "Accueil",
}: BaseBreadcrumbProps) {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);
  const labelOverrides = useBreadcrumbLabels();

  if (segments.length === 0) {
    return null;
  }

  return (
    <section id="breadcrumb" className="container mx-auto p-4">
      <Breadcrumb className={cn(className)}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={homeHref}
                className="hover:underline focus:underline"
                >
                {homeLabel}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;
            const label = labelOverrides[href] ?? formatSegmentLabel(segment);

            return (
              <Fragment key={href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        href={href}
                        className="hover:underline focus:underline"
                        >
                        {label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </section>
  );
}
