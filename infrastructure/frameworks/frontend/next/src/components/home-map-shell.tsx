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
        <div className="w-1/4 xl:w-2/5 aspect-square mx-auto animate-pulse bg-gray-200 rounded-full"></div>
      </div>
    ),
  },
);

export function HomeMapShell() {
  return <HomeGlobeMap />;
}
