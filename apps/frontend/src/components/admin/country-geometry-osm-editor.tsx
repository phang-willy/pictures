"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

import { cn } from "@/lib/utils";

/** Fix Leaflet default marker URLs with bundlers (draw toolbar / vertices). */
function fixLeafletDefaultIcons(): void {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: string;
  };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

/** Leaflet.draw still calls deprecated `_flat`; map it to modern API. */
function applyLeafletDrawCompat(): void {
  const polylineCompat = L.Polyline as unknown as {
    _flat?: (latlngs: unknown) => boolean;
  };
  if (typeof polylineCompat._flat !== "function") {
    polylineCompat._flat = L.LineUtil.isFlat as (latlngs: unknown) => boolean;
  }
}

function isPosition(a: unknown): a is [number, number] {
  return (
    Array.isArray(a) &&
    a.length >= 2 &&
    typeof a[0] === "number" &&
    typeof a[1] === "number"
  );
}

/** Heuristic: Polygon coordinates = Position[][]. */
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

/** Heuristic: MultiPolygon coordinates = Position[][][]. */
function looksLikeMultiPolygon(data: unknown): data is number[][][][] {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  const firstPoly = data[0];
  return looksLikePolygonRings(firstPoly);
}

/** Cadre la vue sur les couches dessinées (après layout : double rAF). */
function scheduleFitMapToLayers(map: L.Map, drawnItems: L.FeatureGroup): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        map.invalidateSize();
        const b = drawnItems.getBounds();
        if (b.isValid() && drawnItems.getLayers().length > 0) {
          map.fitBounds(b, { padding: [28, 28], maxZoom: 12 });
        }
      } catch {
        /* ignore */
      }
    });
  });
}

function serializeDrawn(
  drawnItems: L.FeatureGroup,
  geometryType: "Polygon" | "MultiPolygon",
): unknown {
  const layers = drawnItems.getLayers();
  const polygons: GeoJSON.Polygon[] = [];

  for (const layer of layers) {
    const withGeo = layer as L.Layer & {
      toGeoJSON?: () => GeoJSON.Feature | GeoJSON.GeometryCollection;
    };
    if (typeof withGeo.toGeoJSON !== "function") {
      continue;
    }
    const gj = withGeo.toGeoJSON();
    if (gj.type !== "Feature") {
      continue;
    }
    const g = gj.geometry;
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

function loadCoordinateIntoDrawn(
  drawnItems: L.FeatureGroup,
  geometryType: "Polygon" | "MultiPolygon",
  coordinate: unknown,
  map: L.Map,
): void {
  drawnItems.clearLayers();

  if (geometryType === "Polygon") {
    if (!looksLikePolygonRings(coordinate)) {
      return;
    }
    const gj = L.geoJSON(
      { type: "Polygon", coordinates: coordinate } as GeoJSON.Polygon,
      {},
    );
    gj.eachLayer((ly) => drawnItems.addLayer(ly));
  } else {
    if (!looksLikeMultiPolygon(coordinate)) {
      return;
    }
    for (const polyRings of coordinate) {
      const gj = L.geoJSON(
        { type: "Polygon", coordinates: polyRings } as GeoJSON.Polygon,
        {},
      );
      gj.eachLayer((ly) => drawnItems.addLayer(ly));
    }
  }

  scheduleFitMapToLayers(map, drawnItems);
}

export type CountryGeometryOsmEditorProps = {
  geometryType: "Polygon" | "MultiPolygon";
  /** JSON string of the `coordinate` field (GeoJSON coordinates only). */
  geomJson: string;
  onGeomJsonChange: (json: string) => void;
  className?: string;
  ariaLabel?: string;
};

export function CountryGeometryOsmEditor({
  geometryType,
  geomJson,
  onGeomJsonChange,
  className,
  ariaLabel = "Édition de la géométrie sur fond OpenStreetMap",
}: CountryGeometryOsmEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const lastEmittedRef = useRef<string | null>(null);
  const geometryTypeRef = useRef(geometryType);
  const onGeomJsonChangeRef = useRef(onGeomJsonChange);

  useEffect(() => {
    geometryTypeRef.current = geometryType;
    onGeomJsonChangeRef.current = onGeomJsonChange;
  }, [geometryType, onGeomJsonChange]);

  useEffect(() => {
    fixLeafletDefaultIcons();
    applyLeafletDrawCompat();
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const map = L.map(container, {
      zoomControl: true,
      worldCopyJump: true,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    drawnItems.addTo(map);
    drawnItemsRef.current = drawnItems;
    mapRef.current = map;

    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false,
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    const emitFromDrawn = () => {
      const coord = serializeDrawn(drawnItems, geometryTypeRef.current);
      const json = JSON.stringify(coord, null, 2);
      lastEmittedRef.current = json;
      onGeomJsonChangeRef.current(json);
    };

    const tryLoadJson = (json: string) => {
      try {
        const coordinate = JSON.parse(json) as unknown;
        loadCoordinateIntoDrawn(
          drawnItems,
          geometryTypeRef.current,
          coordinate,
          map,
        );
      } catch {
        drawnItems.clearLayers();
      }
    };

    tryLoadJson(geomJson);
    lastEmittedRef.current = geomJson;

    const onCreated = (e: L.LeafletEvent) => {
      const ce = e as L.DrawEvents.Created;
      if (geometryTypeRef.current === "Polygon") {
        drawnItems.clearLayers();
      }
      drawnItems.addLayer(ce.layer);
      emitFromDrawn();
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, emitFromDrawn);
    map.on(L.Draw.Event.DELETED, emitFromDrawn);

    /* Ne pas écraser fitBounds : vue par défaut seulement sans polygone chargé. */
    map.invalidateSize();
    const initialBounds = drawnItems.getBounds();
    if (!initialBounds.isValid() || drawnItems.getLayers().length === 0) {
      map.setView([48.8566, 2.3522], 4);
    }

    let resizeFitTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      if (resizeFitTimer !== null) {
        clearTimeout(resizeFitTimer);
      }
      resizeFitTimer = setTimeout(() => {
        resizeFitTimer = null;
        scheduleFitMapToLayers(map, drawnItems);
      }, 120);
    });
    ro.observe(container);

    return () => {
      if (resizeFitTimer !== null) {
        clearTimeout(resizeFitTimer);
      }
      ro.disconnect();
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, emitFromDrawn);
      map.off(L.Draw.Event.DELETED, emitFromDrawn);
      map.remove();
      mapRef.current = null;
      drawnItemsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once per mount; initial geomJson from first render only
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const drawnItems = drawnItemsRef.current;
    if (!map || !drawnItems) {
      return;
    }
    if (geomJson === lastEmittedRef.current) {
      /* Même géométrie (ex. page édition au chargement) : recentrer si le 1er fit était trop tôt. */
      scheduleFitMapToLayers(map, drawnItems);
      return;
    }
    lastEmittedRef.current = geomJson;
    try {
      const coordinate = JSON.parse(geomJson) as unknown;
      loadCoordinateIntoDrawn(drawnItems, geometryType, coordinate, map);
    } catch {
      drawnItems.clearLayers();
    }
  }, [geomJson, geometryType]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-[min(480px,60vh)] w-full min-h-[300px] overflow-hidden rounded-lg border",
        "[&_.leaflet-container]:z-0 [&_.leaflet-control]:z-400",
        className,
      )}
      role="application"
      aria-label={ariaLabel}
    />
  );
}
