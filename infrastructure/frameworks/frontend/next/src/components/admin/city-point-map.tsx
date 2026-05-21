"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyGlobeAndFrenchLabels } from "@/lib/maplibre-openmaptiles-fr";
import { createMaplibreMapPinElement } from "@/components/maplibre-map-pin-html";
import { openfreemapStyleForTheme } from "@/lib/openfreemap-basemap";
import {
  scheduleMapResize,
  scheduleMapResizeRobust,
} from "@/lib/maplibre-map-resize";
import { cn } from "@/lib/utils";
import { maplibreMapNew } from "@/lib/maplibre-map-new";

type CityPointMapProps = {
  latitude: number;
  longitude: number;
  className?: string;
  ariaLabel?: string;
};

type CameraSnapshot = {
  center: maplibregl.LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
};

export function CityPointMap({
  latitude,
  longitude,
  ariaLabel = "Carte de la ville",
}: CityPointMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const appliedStyleUrlRef = useRef<string | null>(null);
  const themeRef = useRef<string | undefined>(undefined);
  const coordsRef = useRef({ latitude, longitude });
  const ariaLabelRef = useRef(ariaLabel);
  const cameraAfterStyleRef = useRef<CameraSnapshot | null>(null);
  const { resolvedTheme } = useTheme();
  const mapThemeClass =
    resolvedTheme === "dark" ? "maplibre-theme-dark" : "maplibre-theme-light";

  useLayoutEffect(() => {
    themeRef.current = resolvedTheme;
    coordsRef.current = { latitude, longitude };
    ariaLabelRef.current = ariaLabel;
  }, [resolvedTheme, latitude, longitude, ariaLabel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const initialStyle = openfreemapStyleForTheme(themeRef.current);
    const map = maplibreMapNew({
      container,
      initialStyle,
      center: [longitude, latitude],
      zoom: 9,
    });
    mapRef.current = map;
    appliedStyleUrlRef.current = initialStyle;

    const placeMarker = () => {
      markerRef.current?.remove();
      markerRef.current = null;
      const { latitude: lat, longitude: lng } = coordsRef.current;
      const el = createMaplibreMapPinElement({
        ariaLabel: ariaLabelRef.current,
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .addTo(map);
      markerRef.current = marker;
    };

    const onStyleLoad = () => {
      markerRef.current?.remove();
      markerRef.current = null;
      applyGlobeAndFrenchLabels(map);
      scheduleMapResizeRobust(map);
      const preserve = cameraAfterStyleRef.current;
      if (preserve) {
        cameraAfterStyleRef.current = null;
        map.easeTo({
          center: preserve.center,
          zoom: preserve.zoom,
          bearing: preserve.bearing,
          pitch: preserve.pitch,
          duration: 900,
          essential: true,
        });
      } else {
        const { latitude: lat, longitude: lng } = coordsRef.current;
        map.jumpTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 9),
        });
      }
      placeMarker();
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
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      appliedStyleUrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ariaLabel rare ; coords via coordsRef
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }
    coordsRef.current = { latitude, longitude };
    const lngLat: [number, number] = [longitude, latitude];
    if (!markerRef.current) {
      return;
    }
    markerRef.current.setLngLat(lngLat);
    map.flyTo({
      center: lngLat,
      zoom: Math.max(map.getZoom(), 9),
      essential: true,
      duration: 600,
    });
    scheduleMapResize(map);
  }, [latitude, longitude]);

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
        "h-[min(420px,55vh)] w-full min-h-70 overflow-hidden rounded-lg border",
        mapThemeClass,
      )}
      role="application"
      aria-label={ariaLabel}
    >
      <div ref={containerRef} className="relative isolate h-full w-full" />
    </div>
  );
}
