"use client";

import dynamic from "next/dynamic";

const HomeGlobeMap = dynamic(
  () =>
    import("@/components/home-globe-map").then((mod) => ({
      default: mod.HomeGlobeMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
    ),
  },
);

export function HomeMapShell() {
  return <HomeGlobeMap />;
}
