import type { FeatureCollection, Geometry } from "geojson";

export type CountryGeometryPayload = {
  type: "Polygon" | "MultiPolygon";
  coordinate: unknown;
};

export type CountryGeometryBBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

function coordinatePairsFromGeometry(geometry: Geometry): number[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }
  return [];
}

function geometryPairsFromPayload(
  geometry: CountryGeometryPayload | null | undefined,
): number[][] | null {
  if (!geometry?.coordinate || geometry.coordinate === null) {
    return null;
  }
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
    return null;
  }
  if (!Array.isArray(geometry.coordinate)) {
    return null;
  }
  const geo = {
    type: geometry.type,
    coordinates: geometry.coordinate,
  } as Geometry;
  const pairs = coordinatePairsFromGeometry(geo);
  return pairs.length ? pairs : null;
}

/** Boîte englobante du périmètre pays (API `geometry.coordinate`). */
export function countryGeometryBBox(
  geometry: CountryGeometryPayload | null | undefined,
): CountryGeometryBBox | null {
  const pairs = geometryPairsFromPayload(geometry);
  if (!pairs) {
    return null;
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
    return null;
  }

  return { minLng, minLat, maxLng, maxLat };
}

/** Format attendu par `map.fitBounds`. */
export function countryGeometryBoundsLngLat(
  geometry: CountryGeometryPayload | null | undefined,
): [[number, number], [number, number]] | null {
  const b = countryGeometryBBox(geometry);
  if (!b) {
    return null;
  }
  return [
    [b.minLng, b.minLat],
    [b.maxLng, b.maxLat],
  ];
}

/** GeoJSON pour une couche `fill` / `line` MapLibre. */
export function countryGeometryFeatureCollection(
  geometry: CountryGeometryPayload | null | undefined,
): FeatureCollection | null {
  const pairs = geometryPairsFromPayload(geometry);
  if (!pairs || !geometry?.coordinate || !Array.isArray(geometry.coordinate)) {
    return null;
  }
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: geometry.type,
          coordinates: geometry.coordinate as never,
        },
      },
    ],
  };
}

/** Centre du bounding box du périmètre pays. */
export function countryGeometryCenter(
  geometry: CountryGeometryPayload | null | undefined,
): { latitude: number; longitude: number } | null {
  const b = countryGeometryBBox(geometry);
  if (!b) {
    return null;
  }
  return {
    latitude: (b.minLat + b.maxLat) / 2,
    longitude: (b.minLng + b.maxLng) / 2,
  };
}
