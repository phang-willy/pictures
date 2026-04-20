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
      <div className="h-full w-full">
        <div className="max-w-7xl max-h-7xl w-full h-full animate-pulse bg-gray-200 rounded-full"></div>
      </div>
    ),
  },
);

export function HomeMapShell() {
  return <HomeGlobeMap />;
}
