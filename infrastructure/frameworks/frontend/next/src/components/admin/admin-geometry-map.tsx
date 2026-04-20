"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyGlobeAndFrenchLabels } from "@/lib/maplibre-openmaptiles-fr";
import { openfreemapStyleForTheme } from "@/lib/openfreemap-basemap";
import {
  scheduleMapResize,
  scheduleMapResizeRobust,
} from "@/lib/maplibre-map-resize";
import { cn } from "@/lib/utils";
import { maplibreMapNew } from "@/lib/maplibre-map-new";

type GeoJsonGeometry = GeoJSON.Geometry;

/** Payload Prisma / API : type GeoJSON + tableau `coordinates` sous `coordinate`. */
export type AdminGeometryPayload = {
  type: string;
  coordinate: unknown;
} | null;

export type AdminGeometryMapProps = {
  /** Identifiant unique pour les ids de couches MapLibre (ex. id entité, `city-uuid`). */
  instanceId: string;
  geometry: AdminGeometryPayload;
  /** Libellé `aria-label` de la carte. */
  ariaLabel: string;
  emptyMessage?: string;
  unsupportedTypeMessage?: string;
  className?: string;
  /** Props GeoJSON additionnelles sur la feature (ex. countryId pour debug). */
  featureProperties?: Record<string, string | number | boolean | undefined>;
  fitBoundsMaxZoom?: number;
};

function coordinatePairsFromGeometry(geometry: GeoJsonGeometry): number[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }
  return [];
}

function fitToFeature(
  map: MapLibreMap,
  feature: GeoJSON.Feature<GeoJsonGeometry>,
  maxZoom: number,
  options?: { duration?: number },
): void {
  if (
    feature.geometry.type !== "Polygon" &&
    feature.geometry.type !== "MultiPolygon"
  ) {
    return;
  }
  const pairs = coordinatePairsFromGeometry(feature.geometry);
  if (!pairs.length) {
    return;
  }

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const pair of pairs) {
    const [lng, lat] = pair;
    if (typeof lng !== "number" || typeof lat !== "number") {
      continue;
    }
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat)
  ) {
    return;
  }

  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    {
      padding: 40,
      duration: options?.duration ?? 800,
      maxZoom,
    },
  );
}

function sanitizeMapInstanceId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function sourceId(instanceId: string): string {
  return `admin-geo-src-${sanitizeMapInstanceId(instanceId)}`;
}

function fillLayerId(instanceId: string): string {
  return `admin-geo-fill-${sanitizeMapInstanceId(instanceId)}`;
}

function lineLayerId(instanceId: string): string {
  return `admin-geo-line-${sanitizeMapInstanceId(instanceId)}`;
}

type CameraSnapshot = {
  center: maplibregl.LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
};

type AdminGeometryMapCanvasProps = {
  instanceId: string;
  geometry: NonNullable<AdminGeometryPayload>;
  ariaLabel: string;
  featureProperties?: Record<string, string | number | boolean | undefined>;
  fitBoundsMaxZoom?: number;
  resolvedTheme: string | undefined;
  mapThemeClass: string;
  className?: string;
};

function AdminGeometryMapCanvas({
  instanceId,
  geometry,
  ariaLabel: _ariaLabel,
  featureProperties,
  fitBoundsMaxZoom = 8,
  resolvedTheme,
  mapThemeClass,
  className,
}: AdminGeometryMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const appliedStyleUrlRef = useRef<string | null>(null);
  const themeRef = useRef(resolvedTheme);

  const snapshotRef = useRef({
    geometry,
    featureProperties,
    fitBoundsMaxZoom,
  });

  useLayoutEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  useLayoutEffect(() => {
    snapshotRef.current = { geometry, featureProperties, fitBoundsMaxZoom };
  }, [geometry, featureProperties, fitBoundsMaxZoom]);

  const cameraAfterStyleRef = useRef<CameraSnapshot | null>(null);
  const controlsAddedRef = useRef(false);

  const sid = sourceId(instanceId);
  const fid = fillLayerId(instanceId);
  const lid = lineLayerId(instanceId);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const initialStyle = openfreemapStyleForTheme(themeRef.current);
    const map = maplibreMapNew({
      container,
      initialStyle,
      center: [2.3522, 48.8566],
      zoom: 1.5,
    });
    mapRef.current = map;
    appliedStyleUrlRef.current = initialStyle;

    const rebuildGeoLayers = () => {
      const snap = snapshotRef.current;
      const g = snap.geometry;
      const geoJsonGeometry = {
        type: g.type,
        coordinates: g.coordinate,
      } as GeoJsonGeometry;
      const feature: GeoJSON.Feature<GeoJsonGeometry> = {
        type: "Feature",
        properties: { ...(snap.featureProperties ?? {}) },
        geometry: geoJsonGeometry,
      };
      applyGlobeAndFrenchLabels(map);

      if (map.getLayer(fid)) {
        map.removeLayer(fid);
      }
      if (map.getLayer(lid)) {
        map.removeLayer(lid);
      }
      if (map.getSource(sid)) {
        map.removeSource(sid);
      }

      const collection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [feature],
      };
      map.addSource(sid, { type: "geojson", data: collection });
      const firstSymbolLayerId = map
        .getStyle()
        .layers?.find((layer) => layer.type === "symbol")?.id;

      map.addLayer(
        {
          id: fid,
          type: "fill",
          source: sid,
          paint: {
            "fill-color": "#0ea5e9",
            "fill-opacity": 0.28,
          },
        },
        firstSymbolLayerId,
      );

      map.addLayer(
        {
          id: lid,
          type: "line",
          source: sid,
          paint: {
            "line-color": "#0369a1",
            "line-width": 2,
          },
        },
        firstSymbolLayerId,
      );

      if (!controlsAddedRef.current) {
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: true }),
          "top-right",
        );
        controlsAddedRef.current = true;
      }

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
        fitToFeature(map, feature, snap.fitBoundsMaxZoom ?? 8, {
          duration: 800,
        });
      }
      map.once("idle", () => {
        scheduleMapResizeRobust(map);
      });
    };

    const onStyleLoad = () => {
      rebuildGeoLayers();
    };
    map.on("style.load", onStyleLoad);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      map.off("style.load", onStyleLoad);
      ro.disconnect();
      controlsAddedRef.current = false;
      map.remove();
      mapRef.current = null;
      appliedStyleUrlRef.current = null;
    };
  }, [instanceId, sid, fid, lid]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }
    const snap = snapshotRef.current;
    const g = snap.geometry;
    const geoJsonGeometry = {
      type: g.type,
      coordinates: g.coordinate,
    } as GeoJsonGeometry;
    const feature: GeoJSON.Feature<GeoJsonGeometry> = {
      type: "Feature",
      properties: { ...(snap.featureProperties ?? {}) },
      geometry: geoJsonGeometry,
    };
    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [feature],
    };

    const src = map.getSource(sid) as maplibregl.GeoJSONSource | undefined;
    if (!src) {
      return;
    }
    src.setData(collection);
    fitToFeature(map, feature, snap.fitBoundsMaxZoom ?? 8, { duration: 800 });
    scheduleMapResize(map);
  }, [geometry, featureProperties, fitBoundsMaxZoom, sid]);

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
      aria-label={_ariaLabel}
    >
      <div ref={containerRef} className="relative isolate h-full w-full" />
    </div>
  );
}

const defaultEmptyMessage =
  "Aucune géométrie enregistrée pour afficher la carte.";

export function AdminGeometryMap({
  instanceId,
  geometry,
  ariaLabel,
  emptyMessage = defaultEmptyMessage,
  unsupportedTypeMessage,
  className,
  featureProperties,
  fitBoundsMaxZoom,
}: AdminGeometryMapProps) {
  const { resolvedTheme } = useTheme();
  const mapThemeClass =
    resolvedTheme === "dark" ? "maplibre-theme-dark" : "maplibre-theme-light";

  const canShowMap = useMemo(() => {
    if (!geometry?.type || geometry.coordinate === undefined) {
      return false;
    }
    return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
  }, [geometry]);

  if (!geometry) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  if (!canShowMap) {
    const msg =
      unsupportedTypeMessage ??
      `Géométrie non affichable sur la carte (type : ${geometry.type}).`;
    return <p className="text-sm text-muted-foreground">{msg}</p>;
  }

  return (
    <AdminGeometryMapCanvas
      instanceId={instanceId}
      geometry={geometry as NonNullable<AdminGeometryPayload>}
      ariaLabel={ariaLabel}
      featureProperties={featureProperties}
      fitBoundsMaxZoom={fitBoundsMaxZoom}
      resolvedTheme={resolvedTheme}
      mapThemeClass={mapThemeClass}
      className={className}
    />
  );
}
