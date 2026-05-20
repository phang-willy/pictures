"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyGlobeAndFrenchLabels } from "@/lib/maplibre-openmaptiles-fr";
import { MaplibreMapPinHtml } from "@/components/maplibre-map-pin-html";
import { openfreemapStyleForTheme } from "@/lib/openfreemap-basemap";
import {
  scheduleMapResize,
  scheduleMapResizeRobust,
} from "@/lib/maplibre-map-resize";
import { cn } from "@/lib/utils";
import { maplibreMapNew } from "@/lib/maplibre-map-new";

const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 4;

export type CityPointOsmEditorProps = {
  latitude: number | null;
  longitude: number | null;
  onPointChange: (point: { latitude: number; longitude: number }) => void;
  className?: string;
  ariaLabel?: string;
};

type CameraSnapshot = {
  center: maplibregl.LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
};

function buildPinElement(ariaLabel: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className =
    "cursor-pointer bg-transparent border-0 p-0 m-0 touch-none";
  element.style.zIndex = "20";
  element.setAttribute("aria-label", ariaLabel);
  element.innerHTML = MaplibreMapPinHtml(ariaLabel);
  return element;
}

export function CityPointOsmEditor({
  latitude,
  longitude,
  onPointChange,
  className,
  ariaLabel = "Édition du point de la ville sur la carte",
}: CityPointOsmEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onPointChangeRef = useRef(onPointChange);
  const appliedStyleUrlRef = useRef<string | null>(null);
  const themeRef = useRef<string | undefined>(undefined);
  const latestCoordsRef = useRef({ latitude, longitude });
  const cameraAfterStyleRef = useRef<CameraSnapshot | null>(null);
  const suppressMapClickUntilRef = useRef(0);
  const ariaLabelRef = useRef(ariaLabel);
  const { resolvedTheme } = useTheme();
  const mapThemeClass =
    resolvedTheme === "dark" ? "maplibre-theme-dark" : "maplibre-theme-light";

  useLayoutEffect(() => {
    themeRef.current = resolvedTheme;
    latestCoordsRef.current = { latitude, longitude };
    ariaLabelRef.current = ariaLabel;
  }, [resolvedTheme, latitude, longitude, ariaLabel]);

  useEffect(() => {
    onPointChangeRef.current = onPointChange;
  }, [onPointChange]);

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

    const syncMarkerToCoords = (opts?: { skipEase?: boolean }) => {
      const { latitude: lat, longitude: lng } = latestCoordsRef.current;
      if (
        lat === null ||
        lng === null ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        markerRef.current?.remove();
        markerRef.current = null;
        if (!opts?.skipEase) {
          map.jumpTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
        }
        return;
      }
      const center: [number, number] = [lng, lat];
      if (markerRef.current) {
        markerRef.current.setLngLat(center);
      } else {
        const el = buildPinElement(ariaLabelRef.current);
        const marker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
          draggable: true,
        });
        marker.on("dragend", () => {
          const p = marker.getLngLat();
          suppressMapClickUntilRef.current = performance.now() + 120;
          onPointChangeRef.current({ latitude: p.lat, longitude: p.lng });
        });
        marker.setLngLat(center).addTo(map);
        markerRef.current = marker;
      }
      if (!opts?.skipEase) {
        map.flyTo({
          center,
          zoom: Math.max(map.getZoom(), 8),
          essential: true,
          duration: 500,
        });
      }
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
      }
      syncMarkerToCoords({ skipEase: !!preserve });
      map.once("idle", () => {
        scheduleMapResizeRobust(map);
      });
    };
    map.on("style.load", onStyleLoad);

    const onMapClick = (event: MapMouseEvent) => {
      if (performance.now() < suppressMapClickUntilRef.current) {
        return;
      }
      const { lat, lng } = event.lngLat;
      onPointChangeRef.current({ latitude: lat, longitude: lng });
    };
    map.on("click", onMapClick);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("click", onMapClick);
      ro.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      appliedStyleUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }
    const { latitude: lat, longitude: lng } = latestCoordsRef.current;
    if (
      lat === null ||
      lng === null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      markerRef.current?.remove();
      markerRef.current = null;
      map.flyTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        essential: true,
        duration: 450,
      });
      scheduleMapResize(map);
      return;
    }
    const center: [number, number] = [lng, lat];
    if (markerRef.current) {
      markerRef.current.setLngLat(center);
    } else {
      const el = buildPinElement(ariaLabelRef.current);
      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        draggable: true,
      });
      marker.on("dragend", () => {
        const p = marker.getLngLat();
        suppressMapClickUntilRef.current = performance.now() + 120;
        onPointChangeRef.current({ latitude: p.lat, longitude: p.lng });
      });
      marker.setLngLat(center).addTo(map);
      markerRef.current = marker;
    }
    map.flyTo({
      center,
      zoom: Math.max(map.getZoom(), 8),
      essential: true,
      duration: 500,
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
        "h-[min(460px,60vh)] w-full min-h-[300px] overflow-hidden rounded-lg border",
        mapThemeClass,
        className,
      )}
      role="application"
      aria-label={ariaLabel}
    >
      <div
        ref={containerRef}
        className="relative isolate h-full w-full [&_.maplibregl-canvas]:outline-none"
      />
    </div>
  );
}
