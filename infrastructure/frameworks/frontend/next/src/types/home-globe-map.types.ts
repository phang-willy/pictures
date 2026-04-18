import type {
  Feature,
  FeatureCollection,
  Geometry,
} from "geojson";

export type GeoJsonGeometry = Geometry;

export type CountryFeatureProperties = {
  name?: string;
  countryId?: string;
  countrySlug?: string;
};

export type CountryFeature = Feature<
  GeoJsonGeometry,
  CountryFeatureProperties
>;

export type CountryFeatureCollection = FeatureCollection<
  GeoJsonGeometry,
  CountryFeatureProperties
>;

export type ApiCountry = {
  id: string;
  iso2: string;
  name: string;
  slug: string;
  geometry?: {
    type: Geometry["type"];
    coordinate: unknown;
  } | null;
};

export type ApiCity = {
  id: string;
  countryId: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
};
