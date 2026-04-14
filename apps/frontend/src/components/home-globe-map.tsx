"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyOpenMapTilesFrenchLabels } from "@/lib/maplibre-openmaptiles-fr";

/** OpenFreeMap + OpenMapTiles, sans clé. @see https://openfreemap.org/ */
const OPENFREEMAP = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

function basemapStyleForTheme(resolved: string | undefined): string {
  return resolved === "dark" ? OPENFREEMAP.dark : OPENFREEMAP.light;
}

function applyGlobeAndFrenchLabels(map: Map): void {
  map.setProjection({ type: "globe" });
  applyOpenMapTilesFrenchLabels(map);
}

export function HomeGlobeMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const appliedStyleUrlRef = useRef<string | null>(null);
  const { resolvedTheme } = useTheme();
  const mapThemeClass =
    resolvedTheme === "dark" ? "maplibre-theme-dark" : "maplibre-theme-light";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const initialStyle = basemapStyleForTheme(resolvedTheme);
    const map = new maplibregl.Map({
      container,
      style: initialStyle,
      center: [2.3522, 48.8566],
      zoom: 2,
      minZoom: 0,
      maxZoom: 20,
    });
    mapRef.current = map;
    appliedStyleUrlRef.current = initialStyle;

    const onStyleLoad = () => {
      applyGlobeAndFrenchLabels(map);
    };
    map.once("style.load", onStyleLoad);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      appliedStyleUrlRef.current = null;
    };
    // Carte créée une seule fois ; le style suit le thème dans l’effet suivant.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- évite de recréer la carte à chaque changement de thème
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const nextUrl = basemapStyleForTheme(resolvedTheme);
    if (appliedStyleUrlRef.current === nextUrl) {
      return;
    }
    appliedStyleUrlRef.current = nextUrl;

    const onStyleLoad = () => {
      applyGlobeAndFrenchLabels(map);
    };
    map.setStyle(nextUrl);
    map.once("style.load", onStyleLoad);
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 min-h-0 h-dvh w-full ${mapThemeClass}`}
      role="application"
      aria-label="Carte interactive : globe en vue large, carte plane en zoom rapproché, toponymes en français lorsque disponibles"
    />
  );
}
