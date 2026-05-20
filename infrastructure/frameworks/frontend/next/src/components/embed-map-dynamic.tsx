"use client";

import { EmbedMap, type EmbedMapProps } from "@/components/embed-map";

export type { EmbedMapProps };

/** Client boundary pour les Server Components : carte sans chargement différé supplémentaire. */
export function EmbedMapDynamic(props: EmbedMapProps) {
  return <EmbedMap {...props} />;
}
