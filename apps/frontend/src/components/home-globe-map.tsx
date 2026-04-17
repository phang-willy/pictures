"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyOpenMapTilesFrenchLabels } from "@/lib/maplibre-openmaptiles-fr";
import { apiUrl } from "@/lib/api";

/** OpenFreeMap + OpenMapTiles, sans clé. @see https://openfreemap.org/ */
const OPENFREEMAP = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

const COUNTRY_SHAPES_SOURCE_ID = "countries-shapes-source";
const COUNTRY_SHAPES_FILL_LAYER_ID = "countries-shapes-fill";
const COUNTRY_SHAPES_OUTLINE_LAYER_ID = "countries-shapes-outline";
const CITY_MARKERS_MIN_ZOOM = 4;

type GeoJsonGeometry = GeoJSON.Geometry;
type CountryFeatureProperties = {
  name?: string;
  countryId?: string;
  countrySlug?: string;
};
type CountryFeature = GeoJSON.Feature<
  GeoJsonGeometry,
  CountryFeatureProperties
>;
type CountryFeatureCollection = GeoJSON.FeatureCollection<
  GeoJsonGeometry,
  CountryFeatureProperties
>;
type ApiCountry = {
  id: string;
  codeIso2: string;
  name: string;
  slug: string;
  geometry?: {
    type: GeoJsonGeometry["type"];
    coordinate: unknown;
  } | null;
};
type ApiCity = {
  id: string;
  countryId: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
};

function basemapStyleForTheme(resolved: string | undefined): string {
  return resolved === "dark" ? OPENFREEMAP.dark : OPENFREEMAP.light;
}

function slugifyCountryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function countrySlugFallbackFromName(name: string): string {
  const slug = slugifyCountryName(name);
  // Aligne quelques variantes fréquentes des noms GeoJSON avec les slugs DB.
  if (slug === "viet-nam") {
    return "vietnam";
  }
  return slug;
}

function coordinatePairsFromGeometry(geometry: GeoJsonGeometry): number[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }
  return [];
}

function fitToFeature(map: MapLibreMap, feature: CountryFeature): void {
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
      padding: 48,
      duration: 1000,
      maxZoom: 6,
    },
  );
}

function addCountryLayers(
  map: MapLibreMap,
  countries: CountryFeatureCollection,
): void {
  if (!map.getSource(COUNTRY_SHAPES_SOURCE_ID)) {
    map.addSource(COUNTRY_SHAPES_SOURCE_ID, {
      type: "geojson",
      data: countries,
    });
  } else {
    const source = map.getSource(
      COUNTRY_SHAPES_SOURCE_ID,
    ) as maplibregl.GeoJSONSource;
    source.setData(countries);
  }
  const firstSymbolLayerId = map
    .getStyle()
    .layers?.find((layer) => layer.type === "symbol")?.id;

  if (!map.getLayer(COUNTRY_SHAPES_FILL_LAYER_ID)) {
    map.addLayer(
      {
        id: COUNTRY_SHAPES_FILL_LAYER_ID,
        type: "fill",
        source: COUNTRY_SHAPES_SOURCE_ID,
        paint: {
          "fill-color": "#0ea5e9",
          "fill-opacity": 0.22,
        },
      },
      firstSymbolLayerId,
    );
  }

  if (!map.getLayer(COUNTRY_SHAPES_OUTLINE_LAYER_ID)) {
    map.addLayer(
      {
        id: COUNTRY_SHAPES_OUTLINE_LAYER_ID,
        type: "line",
        source: COUNTRY_SHAPES_SOURCE_ID,
        paint: {
          "line-color": "#0284c7",
          "line-width": 1.5,
        },
      },
      firstSymbolLayerId,
    );
  }

  // Garde les polygones pays en bas des couches custom.
  if (map.getLayer(COUNTRY_SHAPES_FILL_LAYER_ID)) {
    map.moveLayer(COUNTRY_SHAPES_FILL_LAYER_ID, firstSymbolLayerId);
  }
  if (map.getLayer(COUNTRY_SHAPES_OUTLINE_LAYER_ID)) {
    map.moveLayer(COUNTRY_SHAPES_OUTLINE_LAYER_ID, firstSymbolLayerId);
  }
}

function markerPinHtml(): string {
  // Icône inspirée de lucide map-pin: https://v0.lucide.dev/icons/map-pin
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f00612" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
  `;
}

function clearCityMarkers(markers: maplibregl.Marker[]): void {
  for (const marker of markers) {
    marker.remove();
  }
  markers.length = 0;
}

function renderCityMarkers(
  map: MapLibreMap,
  markers: maplibregl.Marker[],
  cities: ApiCity[],
): void {
  clearCityMarkers(markers);

  for (const city of cities) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "cursor-pointer bg-transparent border-0 p-0 m-0";
    element.style.zIndex = "20";
    element.setAttribute("aria-label", `Ville: ${city.name}`);
    element.innerHTML = markerPinHtml();
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      map.flyTo({
        center: [city.longitude, city.latitude],
        zoom: Math.max(map.getZoom(), 9),
        essential: true,
        duration: 900,
      });
    });

    const marker = new maplibregl.Marker({ element, anchor: "bottom" })
      .setLngLat([city.longitude, city.latitude])
      .addTo(map);
    markers.push(marker);
  }
}

function applyGlobeAndFrenchLabels(map: MapLibreMap): void {
  map.setProjection({ type: "globe" });
  applyOpenMapTilesFrenchLabels(map);
}

export function HomeGlobeMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const appliedStyleUrlRef = useRef<string | null>(null);
  const countriesGeoJsonRef = useRef<CountryFeatureCollection | null>(null);
  const cityMarkersRef = useRef<maplibregl.Marker[]>([]);
  const selectedCountryKeyRef = useRef<string | null>(null);
  const cityCacheRef = useRef<Map<string, ApiCity[]>>(new Map());
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
    const cityMarkers = cityMarkersRef.current;
    const cityCache = cityCacheRef.current;
    let isDisposed = false;

    const tryAddCountryLayers = () => {
      if (
        isDisposed ||
        mapRef.current !== map ||
        !countriesGeoJsonRef.current
      ) {
        return;
      }
      try {
        addCountryLayers(map, countriesGeoJsonRef.current);
      } catch {
        // Le style peut être en transition (setStyle) : on réessaie au prochain style.load.
        map.once("style.load", tryAddCountryLayers);
      }
    };

    const tryAddCityMarkers = () => {
      if (isDisposed || mapRef.current !== map) {
        return;
      }
    };

    const getCountrySelectionFromFeature = (feature: CountryFeature) => {
      const countryId = feature.properties?.countryId ?? null;
      const countrySlug =
        feature.properties?.countrySlug ??
        countrySlugFallbackFromName(feature.properties?.name ?? "");
      if (countryId) {
        return {
          query: { countryId, countrySlug },
          key: `id:${countryId}`,
        };
      }
      if (countrySlug) {
        return {
          query: { countrySlug },
          key: `slug:${countrySlug}`,
        };
      }
      return null;
    };

    const applyMarkersForSelectedCountry = () => {
      if (map.getZoom() < CITY_MARKERS_MIN_ZOOM) {
        clearCityMarkers(cityMarkers);
        return;
      }
      const selectedKey = selectedCountryKeyRef.current;
      if (!selectedKey) {
        clearCityMarkers(cityMarkers);
        return;
      }
      const cached = cityCache.get(selectedKey);
      if (!cached) {
        clearCityMarkers(cityMarkers);
        return;
      }
      renderCityMarkers(map, cityMarkers, cached);
    };

    const loadCitiesForCountry = async (
      countryKey: {
        countryId?: string | null;
        countrySlug?: string | null;
      },
      cacheKey: string,
    ) => {
      const query = countryKey.countryId
        ? `countryId=${encodeURIComponent(countryKey.countryId)}`
        : `countrySlug=${encodeURIComponent(countryKey.countrySlug ?? "")}`;
      const cachedCities = cityCache.get(cacheKey);
      if (cachedCities) {
        applyMarkersForSelectedCountry();
        return;
      }
      try {
        const response = await fetch(apiUrl(`/api/city?${query}`));
        if (!response.ok) {
          throw new Error("city api fetch failed");
        }
        const cities = (await response.json()) as ApiCity[];
        if (
          isDisposed ||
          mapRef.current !== map ||
          selectedCountryKeyRef.current !== cacheKey
        ) {
          return;
        }
        cityCache.set(cacheKey, cities);
        renderCityMarkers(map, cityMarkers, cities);
      } catch {
        if (
          isDisposed ||
          mapRef.current !== map ||
          selectedCountryKeyRef.current !== cacheKey
        ) {
          return;
        }
        cityCache.delete(cacheKey);
        clearCityMarkers(cityMarkers);
      }
      tryAddCityMarkers();
    };

    const syncCountryFromViewport = () => {
      if (!map.getLayer(COUNTRY_SHAPES_FILL_LAYER_ID)) {
        return;
      }
      if (map.getZoom() < CITY_MARKERS_MIN_ZOOM) {
        clearCityMarkers(cityMarkers);
        return;
      }
      const center = map.getCenter();
      const pixel = map.project(center);
      const centerFeatures = map.queryRenderedFeatures([pixel.x, pixel.y], {
        layers: [COUNTRY_SHAPES_FILL_LAYER_ID],
      }) as CountryFeature[];
      const feature = centerFeatures[0];
      if (!feature) {
        clearCityMarkers(cityMarkers);
        return;
      }
      const selection = getCountrySelectionFromFeature(feature);
      if (!selection) {
        clearCityMarkers(cityMarkers);
        return;
      }
      if (selectedCountryKeyRef.current !== selection.key) {
        selectedCountryKeyRef.current = selection.key;
        clearCityMarkers(cityMarkers);
        void loadCitiesForCountry(selection.query, selection.key);
        return;
      }
      applyMarkersForSelectedCountry();
    };

    const onStyleLoad = () => {
      applyGlobeAndFrenchLabels(map);
      tryAddCountryLayers();
      tryAddCityMarkers();
      syncCountryFromViewport();
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

    void fetch(apiUrl("/api/country?includeGeometry=true&activeOnly=true"))
      .then(async (response) => {
        if (isDisposed || mapRef.current !== map) {
          return;
        }
        if (!response.ok) {
          throw new Error("country api fetch failed");
        }
        const countries = (await response.json()) as ApiCountry[];
        const filtered: CountryFeatureCollection = {
          type: "FeatureCollection",
          features: (countries ?? [])
            .map((country) => {
              const geometryType = country.geometry?.type;
              const coordinates = country.geometry?.coordinate;
              if (!geometryType || coordinates === undefined) {
                return null;
              }
              const geometry = {
                type: geometryType,
                coordinates,
              } as GeoJsonGeometry;
              if (
                geometry.type !== "Polygon" &&
                geometry.type !== "MultiPolygon"
              ) {
                return null;
              }
              return {
                type: "Feature",
                properties: {
                  name: country.name,
                  countryId: country.id,
                  countrySlug: country.slug,
                },
                geometry,
              } as CountryFeature;
            })
            .filter((feature): feature is CountryFeature => feature !== null),
        };

        if (filtered.features.length === 0) {
          throw new Error("country geometry payload is empty");
        }

        // Garantit un fallback slug cohérent même si le payload est incomplet.
        for (const feature of filtered.features) {
          if (!feature.properties) {
            continue;
          }
          if (!feature.properties.countrySlug && feature.properties.name) {
            feature.properties.countrySlug = countrySlugFallbackFromName(
              feature.properties.name,
            );
          }
        }
        if (isDisposed || mapRef.current !== map) {
          return;
        }
        countriesGeoJsonRef.current = filtered;
        tryAddCountryLayers();
      })
      .catch((error) => {
        console.error(
          "[map] impossible de charger /api/country?includeGeometry=true&activeOnly=true et les polygones",
          error,
        );
      });

    const onCountryClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0] as CountryFeature | undefined;
      if (!feature) {
        return;
      }
      fitToFeature(map, feature);
      const selection = getCountrySelectionFromFeature(feature);
      if (!selection) {
        selectedCountryKeyRef.current = null;
        clearCityMarkers(cityMarkers);
        tryAddCityMarkers();
        return;
      }
      selectedCountryKeyRef.current = selection.key;
      clearCityMarkers(cityMarkers);
      tryAddCityMarkers();
      void loadCitiesForCountry(selection.query, selection.key);
    };
    const onPointerEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onPointerLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", COUNTRY_SHAPES_FILL_LAYER_ID, onCountryClick);
    map.on("moveend", syncCountryFromViewport);
    map.on("zoomend", syncCountryFromViewport);
    map.on("mouseenter", COUNTRY_SHAPES_FILL_LAYER_ID, onPointerEnter);
    map.on("mouseleave", COUNTRY_SHAPES_FILL_LAYER_ID, onPointerLeave);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      map.off("click", COUNTRY_SHAPES_FILL_LAYER_ID, onCountryClick);
      map.off("moveend", syncCountryFromViewport);
      map.off("zoomend", syncCountryFromViewport);
      map.off("mouseenter", COUNTRY_SHAPES_FILL_LAYER_ID, onPointerEnter);
      map.off("mouseleave", COUNTRY_SHAPES_FILL_LAYER_ID, onPointerLeave);
      clearCityMarkers(cityMarkers);
      map.remove();
      mapRef.current = null;
      appliedStyleUrlRef.current = null;
      countriesGeoJsonRef.current = null;
      selectedCountryKeyRef.current = null;
      cityCache.clear();
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
      if (countriesGeoJsonRef.current) {
        try {
          addCountryLayers(map, countriesGeoJsonRef.current);
        } catch {
          // Ignore si le style est encore en transition.
        }
      }
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
