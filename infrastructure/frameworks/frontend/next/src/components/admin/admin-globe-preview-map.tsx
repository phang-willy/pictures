"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyGlobeAndFrenchLabels } from "@/lib/maplibre-openmaptiles-fr";
import { openfreemapStyleForTheme } from "@/lib/openfreemap-basemap";
import { scheduleMapResizeRobust } from "@/lib/maplibre-map-resize";
import { cn } from "@/lib/utils";
import { maplibreMapNew } from "@/lib/maplibre-map-new";

const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 1.5;

export type AdminGlobePreviewMapProps = {
  className?: string;
  ariaLabel?: string;
};

type CameraSnapshot = {
  center: maplibregl.LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
};

/**
 * Globe 3D OpenFreeMap sans couche métier — même base que la carte pays (vue).
 */
export function AdminGlobePreviewMap({
  className,
  ariaLabel = "Aperçu globe",
}: AdminGlobePreviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const appliedStyleUrlRef = useRef<string | null>(null);
  const themeRef = useRef<string | undefined>(undefined);
  const cameraAfterStyleRef = useRef<CameraSnapshot | null>(null);
  const { resolvedTheme } = useTheme();
  const mapThemeClass =
    resolvedTheme === "dark" ? "maplibre-theme-dark" : "maplibre-theme-light";

  useLayoutEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const initialStyle = openfreemapStyleForTheme(themeRef.current);
    const map = maplibreMapNew({
      container,
      initialStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    mapRef.current = map;
    appliedStyleUrlRef.current = initialStyle;

    const onStyleLoad = () => {
      applyGlobeAndFrenchLabels(map);
      scheduleMapResizeRobust(map);
      const snap = cameraAfterStyleRef.current;
      if (snap) {
        cameraAfterStyleRef.current = null;
        map.easeTo({
          center: snap.center,
          zoom: snap.zoom,
          bearing: snap.bearing,
          pitch: snap.pitch,
          duration: 900,
          essential: true,
        });
      }
      map.once("idle", () => {
        scheduleMapResizeRobust(map);
      });
    };
    map.on("style.load", onStyleLoad);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      map.off("style.load", onStyleLoad);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      appliedStyleUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const next = openfreemapStyleForTheme(resolvedTheme);
    if (appliedStyleUrlRef.current === next) {
      return;
    }
    cameraAfterStyleRef.current = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };
    appliedStyleUrlRef.current = next;
    map.setStyle(next);
  }, [resolvedTheme]);

  return (
    <div
      lang="fr"
      className={cn(
        "h-[min(420px,55vh)] w-full min-h-[280px] overflow-hidden rounded-lg border",
        mapThemeClass,
        className,
      )}
      role="application"
      aria-label={ariaLabel}
    >
      <div
        ref={containerRef}
        className="relative isolate h-full w-full"
      />
    </div>
  );
}
