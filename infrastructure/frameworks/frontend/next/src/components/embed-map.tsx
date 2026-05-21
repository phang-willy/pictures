"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { createMaplibreMapPinElement } from "@/components/maplibre-map-pin-html";
import {
  scheduleMapResize,
  scheduleMapResizeRobust,
} from "@/lib/maplibre-map-resize";
import { applyOpenMapTilesFrenchLabelsWhenReady } from "@/lib/maplibre-openmaptiles-fr";
import type { CountryGeometryPayload } from "@/lib/country-geometry-center";
import {
  countryGeometryBoundsLngLat,
  countryGeometryCenter,
  countryGeometryFeatureCollection,
} from "@/lib/country-geometry-center";
import {
  closeMaplibreAttributions,
  maplibreMapNew,
} from "@/lib/maplibre-map-new";
import { openfreemapStyleForTheme } from "@/lib/openfreemap-basemap";
import { cn } from "@/lib/utils";

const DEFAULT_EMBED_ZOOM = 9;
/** Cadre max pour les cartes pays (polygone), aligné sur le zoom « pays » (9). */
const POLYGON_FIT_MAX_ZOOM = 9;

function resolveEmbedZoom(opts: {
  zoom?: number;
  from?: "city" | "country";
  modePolygon: boolean;
}): number {
  if (typeof opts.zoom === "number") {
    return opts.zoom;
  }
  if (opts.from === "city") {
    return 11;
  }
  if (opts.from === "country") {
    return 9;
  }
  if (opts.modePolygon) {
    return 9;
  }
  return DEFAULT_EMBED_ZOOM;
}

const POLYGON_SOURCE_ID = "embed-map-country-geo";
const POLYGON_FILL_LAYER_ID = "embed-map-country-fill";
const POLYGON_OUTLINE_LAYER_ID = "embed-map-country-outline";

function disableEmbedMapInteractions(map: MapLibreMap) {
  map.dragPan.disable();
  map.scrollZoom.disable();
  map.dragRotate.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();
  map.touchPitch.disable();
  map.boxZoom.disable();
}

function removeEmbedPolygonLayers(map: MapLibreMap) {
  if (map.getLayer(POLYGON_OUTLINE_LAYER_ID)) {
    map.removeLayer(POLYGON_OUTLINE_LAYER_ID);
  }
  if (map.getLayer(POLYGON_FILL_LAYER_ID)) {
    map.removeLayer(POLYGON_FILL_LAYER_ID);
  }
  if (map.getSource(POLYGON_SOURCE_ID)) {
    map.removeSource(POLYGON_SOURCE_ID);
  }
}

function addEmbedPolygonLayers(
  map: MapLibreMap,
  data: FeatureCollection,
  dark: boolean,
) {
  removeEmbedPolygonLayers(map);
  map.addSource(POLYGON_SOURCE_ID, {
    type: "geojson",
    data,
  });
  const firstSymbolLayerId = map
    .getStyle()
    .layers?.find((layer) => layer.type === "symbol")?.id;

  map.addLayer(
    {
      id: POLYGON_FILL_LAYER_ID,
      type: "fill",
      source: POLYGON_SOURCE_ID,
      paint: {
        "fill-color": dark ? "#38bdf8" : "#0ea5e9",
        "fill-opacity": dark ? 0.18 : 0.22,
      },
    },
    firstSymbolLayerId,
  );

  map.addLayer(
    {
      id: POLYGON_OUTLINE_LAYER_ID,
      type: "line",
      source: POLYGON_SOURCE_ID,
      paint: {
        "line-color": dark ? "#7dd3fc" : "#0284c7",
        "line-width": 1.5,
      },
    },
    firstSymbolLayerId,
  );

  if (map.getLayer(POLYGON_FILL_LAYER_ID) && firstSymbolLayerId) {
    map.moveLayer(POLYGON_FILL_LAYER_ID, firstSymbolLayerId);
  }
  if (map.getLayer(POLYGON_OUTLINE_LAYER_ID) && firstSymbolLayerId) {
    map.moveLayer(POLYGON_OUTLINE_LAYER_ID, firstSymbolLayerId);
  }
}

function runWhenEmbedStyleSafe(map: MapLibreMap, fn: () => void) {
  try {
    fn();
  } catch {
    const retry = () => {
      map.off("idle", retry);
      map.off("style.load", retry);
      try {
        fn();
      } catch {
        /* ignore */
      }
    };
    map.once("idle", retry);
    map.once("style.load", retry);
  }
}

type CameraSnapshot = {
  center: maplibregl.LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
};

export type EmbedMapProps = {
  latitude?: number;
  longitude?: number;
  /** Si défini, affiche le périmètre pays (sans épingle) et cadre la carte dessus. */
  countryGeometry?: CountryGeometryPayload | null;
  /**
   * Zoom MapLibre en mode point (ignoré pour le cadrage polygone, sauf valeur initiale avant fitBounds).
   * Si omis : `from === "city"` → 12, `from === "country"` ou polygone sans `from` → 9, sinon 9.
   */
  zoom?: number;
  /** Contexte : zoom par défaut quand `zoom` n’est pas fourni (ville 12, pays 9). */
  from?: "city" | "country";
  /**
   * Épingle sur un point (lat/lng). Si omis : pas d’épingle lorsque `from === "city"`, sinon épingle affichée.
   */
  showMarker?: boolean;
  className?: string;
  ariaLabel?: string;
};

/**
 * Carte légère (tuiles OpenFreeMap comme la page d’accueil), sans projection globe,
 * pour incrustation dans une carte UI - carte statique (pas de pan/zoom molette ni souris).
 */
export function EmbedMap({
  latitude,
  longitude,
  countryGeometry,
  zoom,
  from,
  showMarker,
  className,
  ariaLabel = "Carte du lieu",
}: EmbedMapProps) {
  const geometryFc = useMemo(
    () => countryGeometryFeatureCollection(countryGeometry ?? undefined),
    [countryGeometry],
  );

  const geometryStableKey = useMemo(() => {
    if (!countryGeometry?.coordinate) return "";
    try {
      return JSON.stringify(countryGeometry.coordinate);
    } catch {
      return "";
    }
  }, [countryGeometry]);

  const geoCenter = useMemo(
    () => countryGeometryCenter(countryGeometry ?? undefined),
    [countryGeometry],
  );

  const resolvedLat =
    typeof latitude === "number"
      ? latitude
      : geoCenter?.latitude ?? null;
  const resolvedLng =
    typeof longitude === "number"
      ? longitude
      : geoCenter?.longitude ?? null;

  const modePolygon = geometryFc !== null;
  const valid =
    modePolygon ||
    (resolvedLat !== null &&
      resolvedLng !== null &&
      Number.isFinite(resolvedLat) &&
      Number.isFinite(resolvedLng));

  const resolvedEmbedZoom = useMemo(
    () => resolveEmbedZoom({ zoom, from, modePolygon }),
    [zoom, from, modePolygon],
  );

  const showPin = useMemo(() => {
    if (modePolygon) return false;
    if (typeof showMarker === "boolean") return showMarker;
    return from !== "city";
  }, [modePolygon, showMarker, from]);

  const zoomRef = useRef(resolvedEmbedZoom);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const appliedStyleUrlRef = useRef<string | null>(null);
  const themeRef = useRef<string | undefined>(undefined);
  const coordsRef = useRef({
    latitude: resolvedLat ?? 0,
    longitude: resolvedLng ?? 0,
  });
  const geometryRef = useRef(countryGeometry ?? null);
  const ariaLabelRef = useRef(ariaLabel);
  const cameraAfterStyleRef = useRef<CameraSnapshot | null>(null);
  const { resolvedTheme } = useTheme();
  const mapThemeClass =
    resolvedTheme === "dark" ? "maplibre-theme-dark" : "maplibre-theme-light";

  useLayoutEffect(() => {
    themeRef.current = resolvedTheme;
    coordsRef.current = {
      latitude: resolvedLat ?? 0,
      longitude: resolvedLng ?? 0,
    };
    geometryRef.current = countryGeometry ?? null;
    ariaLabelRef.current = ariaLabel;
    zoomRef.current = resolvedEmbedZoom;
  }, [
    resolvedTheme,
    resolvedLat,
    resolvedLng,
    countryGeometry,
    ariaLabel,
    resolvedEmbedZoom,
  ]);

  useEffect(() => {
    if (!valid) {
      return undefined;
    }
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const initialStyle = openfreemapStyleForTheme(themeRef.current);
    const { latitude: initialLat, longitude: initialLng } = coordsRef.current;
    const map = maplibreMapNew({
      container,
      initialStyle,
      center: [initialLng, initialLat],
      zoom: zoomRef.current,
      attributionControl: false,
    });
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      }),
      "bottom-right",
    );
    disableEmbedMapInteractions(map);
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

    const applyPolygonOrMarker = (preserve: CameraSnapshot | null) => {
      const fcNow = countryGeometryFeatureCollection(geometryRef.current);
      const dark = themeRef.current === "dark";

      if (fcNow) {
        markerRef.current?.remove();
        markerRef.current = null;
        runWhenEmbedStyleSafe(map, () => {
          addEmbedPolygonLayers(map, fcNow, dark);
          if (preserve) {
            map.easeTo({
              center: preserve.center,
              zoom: preserve.zoom,
              bearing: preserve.bearing,
              pitch: preserve.pitch,
              duration: 0,
              essential: true,
            });
          } else {
            const bounds = countryGeometryBoundsLngLat(geometryRef.current);
            if (bounds) {
              map.fitBounds(bounds, {
                padding: 20,
                duration: 0,
                maxZoom: POLYGON_FIT_MAX_ZOOM,
              });
            }
          }
        });
        return;
      }

      removeEmbedPolygonLayers(map);
      if (preserve) {
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
          zoom: Math.max(map.getZoom(), zoomRef.current),
        });
      }
      if (showPin) {
        placeMarker();
      } else {
        markerRef.current?.remove();
        markerRef.current = null;
      }
    };

    const onStyleLoad = () => {
      applyOpenMapTilesFrenchLabelsWhenReady(map);
      disableEmbedMapInteractions(map);
      closeMaplibreAttributions(container);
      scheduleMapResizeRobust(map);
      const preserve = cameraAfterStyleRef.current;
      cameraAfterStyleRef.current = null;
      applyPolygonOrMarker(preserve);
      map.once("idle", () => {
        closeMaplibreAttributions(container);
        scheduleMapResizeRobust(map);
      });
    };
    map.on("style.load", onStyleLoad);

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
  }, [valid, showPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !valid) {
      return;
    }

    coordsRef.current = {
      latitude: resolvedLat ?? 0,
      longitude: resolvedLng ?? 0,
    };
    zoomRef.current = resolvedEmbedZoom;

    const fcNow = countryGeometryFeatureCollection(geometryRef.current);
    const dark = resolvedTheme === "dark";

    if (fcNow) {
      markerRef.current?.remove();
      markerRef.current = null;
      runWhenEmbedStyleSafe(map, () => {
        removeEmbedPolygonLayers(map);
        addEmbedPolygonLayers(map, fcNow, dark);
        const bounds = countryGeometryBoundsLngLat(geometryRef.current);
        if (bounds) {
          map.fitBounds(bounds, {
            padding: 20,
            duration: 450,
            maxZoom: POLYGON_FIT_MAX_ZOOM,
          });
        }
      });
      scheduleMapResize(map);
      return;
    }

    removeEmbedPolygonLayers(map);
    const lngLat: [number, number] = [
      coordsRef.current.longitude,
      coordsRef.current.latitude,
    ];
    if (showPin) {
      if (!markerRef.current) {
        const el = createMaplibreMapPinElement({
          ariaLabel: ariaLabelRef.current,
        });
        markerRef.current = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(lngLat)
          .addTo(map);
      } else {
        markerRef.current.setLngLat(lngLat);
      }
    } else {
      markerRef.current?.remove();
      markerRef.current = null;
    }
    map.flyTo({
      center: lngLat,
      zoom: Math.max(map.getZoom(), zoomRef.current),
      essential: true,
      duration: 600,
    });
    scheduleMapResize(map);
  }, [
    resolvedLat,
    resolvedLng,
    resolvedEmbedZoom,
    geometryStableKey,
    valid,
    resolvedTheme,
    showPin,
  ]);

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

  if (!valid) {
    return (
      <div
        lang="fr"
        data-embed-map
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 text-center text-muted-foreground text-xs",
          mapThemeClass,
          className,
        )}
        role="img"
        aria-label={ariaLabel}
      >
        Carte indisponible
      </div>
    );
  }

  return (
    <div
      lang="fr"
      data-embed-map
      className={cn(
        "aspect-square w-full overflow-hidden rounded-md border border-border cursor-default",
        mapThemeClass,
        className,
      )}
      role="application"
      aria-label={ariaLabel}
    >
      <div ref={containerRef} className="relative isolate h-full w-full" />
    </div>
  );
}
