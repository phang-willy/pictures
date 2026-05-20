"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  EDIT_MODES,
  createGeomanInstance,
  type FeatureCreatedFwdEvent,
  type Geoman,
  type GmOptionsPartial,
  type GeoJsonImportFeatureCollection,
} from "@geoman-io/maplibre-geoman-free";
import "maplibre-gl/dist/maplibre-gl.css";
import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";
import { applyGlobeAndFrenchLabels } from "@/lib/maplibre-openmaptiles-fr";
import { openfreemapStyleForTheme } from "@/lib/openfreemap-basemap";
import {
  scheduleMapResize,
  scheduleMapResizeRobust,
} from "@/lib/maplibre-map-resize";
import { maplibreMapNew } from "@/lib/maplibre-map-new";
import { cn } from "@/lib/utils";

type GeoJsonGeometry = GeoJSON.Geometry;

const GEOMAN_OPTIONS: GmOptionsPartial = {
  controls: {
    draw: {
      marker: { uiEnabled: false },
      circle: { uiEnabled: false },
      circle_marker: { uiEnabled: false },
      ellipse: { uiEnabled: false },
      text_marker: { uiEnabled: false },
      line: { uiEnabled: false },
      rectangle: { uiEnabled: false },
      freehand: { uiEnabled: false },
      custom_shape: { uiEnabled: false },
      polygon: { title: "Dessiner un polygone" },
    },
    edit: {
      drag: { title: "Déplacer" },
      change: { title: "Modifier les sommets" },
      rotate: { title: "Pivoter" },
      scale: { title: "Redimensionner" },
      copy: { title: "Copier" },
      cut: { title: "Découper" },
      split: { title: "Scinder" },
      union: { title: "Fusionner" },
      difference: { title: "Soustraire" },
      line_simplification: { title: "Simplifier la ligne" },
      lasso: { title: "Lasso" },
      delete: { title: "Supprimer" },
    },
    helper: {
      shape_markers: { title: "Afficher les sommets" },
      pin: { title: "Épingler" },
      snapping: { title: "Accrochage" },
      snap_guides: { title: "Guides d'accrochage" },
      measurements: { title: "Mesures" },
      auto_trace: { title: "Tracé automatique" },
      geofencing: { title: "Géo-clôture" },
      zoom_to_features: { title: "Zoom sur les objets" },
      click_to_edit: { title: "Cliquer pour modifier" },
    },
  },
};

/** Événements `gm:*` émis après modification d’une géométrie (hors create/remove). */
const GM_UPDATE_EVENT_NAMES: string[] = [
  ...EDIT_MODES.map((m) => `gm:${m}`),
  "gm:edit",
];

function coordinatePairsFromGeometry(geometry: GeoJsonGeometry): number[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }
  return [];
}

function fitMapToGeometry(
  map: MapLibreMap,
  geometry: GeoJsonGeometry,
  maxZoom: number,
): void {
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
    return;
  }
  const pairs = coordinatePairsFromGeometry(geometry);
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
    { padding: 40, duration: 800, maxZoom },
  );
}

function isPosition(a: unknown): a is [number, number] {
  return (
    Array.isArray(a) &&
    a.length >= 2 &&
    typeof a[0] === "number" &&
    typeof a[1] === "number"
  );
}

function looksLikePolygonRings(data: unknown): data is number[][][] {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  const first = data[0];
  if (!Array.isArray(first) || first.length === 0) {
    return false;
  }
  return isPosition(first[0]);
}

function looksLikeMultiPolygon(data: unknown): data is number[][][][] {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  const firstPoly = data[0];
  return looksLikePolygonRings(firstPoly);
}

function featuresFromCoordinate(
  geometryType: "Polygon" | "MultiPolygon",
  coordinate: unknown,
): GeoJSON.Feature<GeoJSON.Polygon>[] {
  if (geometryType === "Polygon") {
    if (!looksLikePolygonRings(coordinate)) {
      return [];
    }
    return [
      {
        type: "Feature",
        id: "country-geom-0",
        properties: {},
        geometry: { type: "Polygon", coordinates: coordinate },
      },
    ];
  }
  if (!looksLikeMultiPolygon(coordinate)) {
    return [];
  }
  return coordinate.map((rings, i) => ({
    type: "Feature",
    id: `country-geom-${i}`,
    properties: {},
    geometry: { type: "Polygon", coordinates: rings },
  }));
}

function importableFeatureCollection(
  geometryType: "Polygon" | "MultiPolygon",
  coordinate: unknown,
): GeoJSON.FeatureCollection {
  const feats = featuresFromCoordinate(geometryType, coordinate);
  return {
    type: "FeatureCollection",
    features: feats.map((f) => ({
      type: "Feature" as const,
      id: f.id,
      properties: {
        ...(typeof f.properties === "object" && f.properties !== null
          ? f.properties
          : {}),
        shape: "polygon" as const,
      },
      geometry: f.geometry,
    })),
  };
}

function serializeDrawn(
  fc: GeoJSON.FeatureCollection,
  geometryType: "Polygon" | "MultiPolygon",
): unknown {
  const polygons: GeoJSON.Polygon[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) {
      continue;
    }
    if (g.type === "Polygon") {
      polygons.push(g);
    } else if (g.type === "MultiPolygon") {
      for (const coords of g.coordinates) {
        polygons.push({ type: "Polygon", coordinates: coords });
      }
    }
  }
  if (geometryType === "Polygon") {
    if (polygons.length === 0) {
      return [];
    }
    return polygons[0].coordinates;
  }
  return polygons.map((p) => p.coordinates);
}

export type CountryGeometryGlobeDrawEditorProps = {
  geometryType: "Polygon" | "MultiPolygon";
  geomJson: string;
  onGeomJsonChange: (json: string) => void;
  className?: string;
  ariaLabel?: string;
  fitBoundsMaxZoom?: number;
};

export function CountryGeometryGlobeDrawEditor({
  geometryType,
  geomJson,
  onGeomJsonChange,
  className,
  ariaLabel = "Édition de la géométrie sur le globe MapLibre",
  fitBoundsMaxZoom = 8,
}: CountryGeometryGlobeDrawEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const gmRef = useRef<Geoman | null>(null);
  const suppressDrawEmitRef = useRef(false);
  const lastEmittedRef = useRef<string | null>(null);
  const geometryTypeRef = useRef(geometryType);
  const onGeomJsonChangeRef = useRef(onGeomJsonChange);
  const fitBoundsMaxZoomRef = useRef(fitBoundsMaxZoom);
  const controlsAddedRef = useRef(false);
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);

  useLayoutEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  useLayoutEffect(() => {
    geometryTypeRef.current = geometryType;
    onGeomJsonChangeRef.current = onGeomJsonChange;
    fitBoundsMaxZoomRef.current = fitBoundsMaxZoom;
  }, [geometryType, onGeomJsonChange, fitBoundsMaxZoom]);

  const mapThemeClass =
    resolvedTheme === "dark" ? "maplibre-theme-dark" : "maplibre-theme-light";

  const geomJsonRef = useRef(geomJson);
  useLayoutEffect(() => {
    geomJsonRef.current = geomJson;
  }, [geomJson]);

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

    const emitFromGeoman = () => {
      if (suppressDrawEmitRef.current) {
        return;
      }
      const gm = gmRef.current;
      if (!gm) {
        return;
      }
      const data = gm.features.exportGeoJson({ allowedShapes: ["polygon"] });
      const coordinate = serializeDrawn(data, geometryTypeRef.current);
      const json = JSON.stringify(coordinate, null, 2);
      lastEmittedRef.current = json;
      onGeomJsonChangeRef.current(json);
    };

    const onGmCreate = async (e: FeatureCreatedFwdEvent) => {
      const gm = gmRef.current;
      if (!gm || geometryTypeRef.current !== "Polygon") {
        emitFromGeoman();
        return;
      }
      const keepId = e.feature.id;
      const toDelete: Array<string | number> = [];
      gm.features.forEach((fd) => {
        if (fd.id !== keepId) {
          toDelete.push(fd.id);
        }
      });
      suppressDrawEmitRef.current = true;
      try {
        for (const id of toDelete) {
          await gm.features.delete(id);
        }
      } finally {
        suppressDrawEmitRef.current = false;
      }
      emitFromGeoman();
    };

    const onGmRemove = () => {
      emitFromGeoman();
    };

    const onGmUpdate = () => {
      emitFromGeoman();
    };

    const loadJsonIntoGeoman = async (
      json: string,
      fit: boolean,
      gm: Geoman,
    ) => {
      suppressDrawEmitRef.current = true;
      try {
        await gm.features.deleteAll();
        const coordinate = JSON.parse(json) as unknown;
        const fc = importableFeatureCollection(
          geometryTypeRef.current,
          coordinate,
        );
        if (fc.features.length > 0) {
          await gm.features.importGeoJson(
            fc as GeoJsonImportFeatureCollection,
            { overwrite: true },
          );
          if (fit) {
            const feats = featuresFromCoordinate(
              geometryTypeRef.current,
              coordinate,
            );
            if (feats.length > 0) {
              const geom: GeoJsonGeometry =
                geometryTypeRef.current === "Polygon"
                  ? {
                      type: "Polygon",
                      coordinates: feats[0].geometry.coordinates,
                    }
                  : {
                      type: "MultiPolygon",
                      coordinates: feats.map(
                        (f) => f.geometry.coordinates,
                      ) as number[][][][],
                    };
              fitMapToGeometry(map, geom, fitBoundsMaxZoomRef.current ?? 8);
            }
          }
        }
      } catch {
        await gm.features.deleteAll();
      } finally {
        suppressDrawEmitRef.current = false;
      }
    };

    let geomanInitLock = false;

    const onStyleLoad = () => {
      applyGlobeAndFrenchLabels(map);

      void (async () => {
        if (geomanInitLock || gmRef.current) {
          return;
        }
        geomanInitLock = true;

        try {
          const gm = await createGeomanInstance(map, GEOMAN_OPTIONS);
          await gm.init();
          await gm.addControls();
          gmRef.current = gm;

          map.on("gm:create" as never, onGmCreate as never);
          map.on("gm:remove" as never, onGmRemove as never);
          for (const name of GM_UPDATE_EVENT_NAMES) {
            map.on(name as never, onGmUpdate as never);
          }

          if (!controlsAddedRef.current) {
            map.addControl(
              new maplibregl.NavigationControl({ showCompass: true }),
              "top-right",
            );
            controlsAddedRef.current = true;
          }

          await gm.enableDraw("polygon");

          const initialJson = geomJsonRef.current;
          lastEmittedRef.current = initialJson;
          await loadJsonIntoGeoman(initialJson, true, gm);

          scheduleMapResizeRobust(map);
          map.once("idle", () => scheduleMapResizeRobust(map));
        } catch {
          geomanInitLock = false;
        }
      })();
    };

    map.on("style.load", onStyleLoad);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("gm:create" as never, onGmCreate as never);
      map.off("gm:remove" as never, onGmRemove as never);
      for (const name of GM_UPDATE_EVENT_NAMES) {
        map.off(name as never, onGmUpdate as never);
      }
      ro.disconnect();

      const m = map;
      const gm = gmRef.current;
      gmRef.current = null;
      mapRef.current = null;
      controlsAddedRef.current = false;

      void (async () => {
        if (gm) {
          await gm.destroy({ removeSources: true });
        }
        m.remove();
      })();
    };
  }, [resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    const gm = gmRef.current;
    if (!map?.isStyleLoaded() || !gm) {
      return;
    }
    if (geomJson === lastEmittedRef.current) {
      scheduleMapResize(map);
      return;
    }
    lastEmittedRef.current = geomJson;
    suppressDrawEmitRef.current = true;
    void (async () => {
      try {
        await gm.features.deleteAll();
        const coordinate = JSON.parse(geomJson) as unknown;
        const fc = importableFeatureCollection(geometryType, coordinate);
        if (fc.features.length > 0) {
          await gm.features.importGeoJson(
            fc as GeoJsonImportFeatureCollection,
            { overwrite: true },
          );
          const feats = featuresFromCoordinate(geometryType, coordinate);
          if (feats.length > 0) {
            const geom: GeoJsonGeometry =
              geometryType === "Polygon"
                ? {
                    type: "Polygon",
                    coordinates: feats[0].geometry.coordinates,
                  }
                : {
                    type: "MultiPolygon",
                    coordinates: feats.map(
                      (f) => f.geometry.coordinates,
                    ) as number[][][][],
                  };
            fitMapToGeometry(map, geom, fitBoundsMaxZoom ?? 8);
          }
        } else {
          await gm.features.deleteAll();
        }
      } catch {
        await gm.features.deleteAll();
      } finally {
        suppressDrawEmitRef.current = false;
      }
      scheduleMapResize(map);
    })();
  }, [geomJson, geometryType, fitBoundsMaxZoom]);

  return (
    <div
      ref={containerRef}
      lang="fr"
      className={cn(
        "h-[min(520px,62vh)] w-full min-h-[320px] overflow-hidden rounded-lg border",
        mapThemeClass,
        className,
      )}
      role="application"
      aria-label={ariaLabel}
    />
  );
}
