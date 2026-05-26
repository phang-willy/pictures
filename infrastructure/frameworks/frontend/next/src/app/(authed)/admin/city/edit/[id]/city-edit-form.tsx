"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { CityPointOsmEditor } from "@/components/admin/city-point-osm-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CityHttpDetail } from "@/types/city.types.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { slugify } from "@/domain/utils/slugify";

type CountryOption = { id: string; name: string; iso2: string };
type ExistsResponse = {
  exists: boolean;
  conflicts: Array<"name" | "slug">;
  match?: {
    id: string;
    name: string;
    slug: string;
  };
};

function extractLngLatPairs(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) {
    return [];
  }
  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    return [[value[0], value[1]]];
  }
  const nested = value as unknown[];
  return nested.flatMap((item) => extractLngLatPairs(item));
}

function parseCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

function centerFromCountryGeometry(geometry: unknown) {
  if (!geometry || typeof geometry !== "object") {
    return null;
  }
  const payload = geometry as { coordinate?: unknown };
  const pairs = extractLngLatPairs(payload.coordinate);
  if (!pairs.length) {
    return null;
  }
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  for (const [lng, lat] of pairs) {
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
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    zoom: 5,
  };
}

export function CityEditForm({
  city,
  countries,
}: {
  city: CityHttpDetail;
  countries: Array<
    CountryOption & { geometry?: { type: string; coordinate: unknown } | null }
  >;
}) {
  const router = useRouter();
  const [countryId, setCountryId] = useState(city.country.id);
  const [name, setName] = useState(city.name);
  const [slug, setSlug] = useState(city.slug);
  const [latitude, setLatitude] = useState<number | null>(() =>
    parseCoord(city.latitude),
  );
  const [longitude, setLongitude] = useState<number | null>(() =>
    parseCoord(city.longitude),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [existsResult, setExistsResult] = useState<ExistsResponse | null>(null);
  const [existsLoading, setExistsLoading] = useState(false);
  const [existsFetchError, setExistsFetchError] = useState(false);
  const existsCheckGenRef = useRef(0);

  const canSubmit = useMemo(
    () =>
      !!countryId &&
      name.trim().length > 0 &&
      slug.trim().length > 0 &&
      latitude !== null &&
      longitude !== null,
    [countryId, name, slug, latitude, longitude],
  );

  const canCheckExists =
    !!countryId && name.trim().length > 0 && slug.trim().length > 0;
  /**
   * Recentrer uniquement quand l’utilisateur change de pays.
   * Ne pas dépendre d’un objet `useMemo` (nouvelle ref à chaque render parent) :
   * sinon on réécrivait lat/lng avec le centre du pays et écrasait la position en base.
   */
  const prevCountryIdForMapRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevCountryIdForMapRef.current === undefined) {
      prevCountryIdForMapRef.current = countryId;
      return;
    }
    if (prevCountryIdForMapRef.current === countryId) {
      return;
    }
    prevCountryIdForMapRef.current = countryId;
    const country = countries.find((c) => c.id === countryId);
    const point = centerFromCountryGeometry(country?.geometry ?? null);
    if (!point) {
      return;
    }
    setLatitude(point.latitude);
    setLongitude(point.longitude);
  }, [countryId, countries]);

  useEffect(() => {
    if (!canCheckExists) {
      setExistsResult(null);
      setExistsFetchError(false);
      setExistsLoading(false);
      return;
    }
    setExistsResult(null);
    setExistsFetchError(false);
    const t = window.setTimeout(() => {
      const gen = (existsCheckGenRef.current += 1);
      void (async () => {
        setExistsLoading(true);
        try {
          const q = new URLSearchParams({
            country_id: countryId,
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            exclude_city_id: city.id,
          });
          const res = await apiFetch(`/api/city/exists?${q.toString()}`);
          const data = (await res.json().catch(() => ({}))) as ExistsResponse;
          if (gen !== existsCheckGenRef.current) {
            return;
          }
          if (!res.ok) {
            setExistsResult(null);
            setExistsFetchError(true);
            return;
          }
          setExistsFetchError(false);
          setExistsResult(data);
        } catch {
          if (gen !== existsCheckGenRef.current) {
            return;
          }
          setExistsResult(null);
          setExistsFetchError(true);
        } finally {
          if (gen === existsCheckGenRef.current) {
            setExistsLoading(false);
          }
        }
      })();
    }, 500);
    return () => {
      existsCheckGenRef.current += 1;
      window.clearTimeout(t);
    };
  }, [canCheckExists, countryId, name, slug, city.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!canSubmit || latitude === null || longitude === null) {
      setSubmitError("Renseignez tous les champs et placez un point.");
      return;
    }
    if (!existsResult || existsFetchError) {
      setSubmitError(
        "Vérifiez les doublons (appel API) avant d’enregistrer, ou corrigez les champs.",
      );
      return;
    }
    if (existsResult.exists) {
      setSubmitError(
        "Une autre ville utilise déjà ce nom ou ce slug dans ce pays.",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`/api/city/${encodeURIComponent(city.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryId,
          name: name.trim(),
          slug: slugify(slug),
          latitude,
          longitude,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: unknown;
      };
      if (!res.ok) {
        setSubmitError(
          typeof data.message === "string"
            ? data.message
            : `Erreur ${res.status} lors de l'enregistrement.`,
        );
        return;
      }
      toast.success("Modifications enregistrées avec succès.");
      router.push(`/admin/city/view/${encodeURIComponent(city.id)}`);
    } catch {
      setSubmitError("Impossible de contacter l'API.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Champs</CardTitle>
          </CardHeader>
          <CardContent>
            {existsFetchError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  Impossible de vérifier les doublons. Réessayez ou
                  reconnectez-vous.
                </AlertDescription>
              </Alert>
            ) : null}
            {existsResult?.exists ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertTitle>Conflit</AlertTitle>
                <AlertDescription className="space-y-2">
                  {existsResult.match && existsResult.match.id !== city.id ? (
                    <p>
                      <strong>{existsResult.match.name}</strong> (slug:{" "}
                      {existsResult.match.slug}) utilise déjà l&apos;un des champs
                      : {existsResult.conflicts.join(", ")}.
                    </p>
                  ) : (
                    <p>
                      Champs en conflit : {existsResult.conflicts.join(", ")}.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            ) : null}
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="city-country">Pays</FieldLabel>
                  <FieldContent>
                    <Select value={countryId} onValueChange={setCountryId}>
                      <SelectTrigger
                        id="city-country"
                        className="w-full max-w-none"
                      >
                        <SelectValue placeholder="Choisir un pays" />
                      </SelectTrigger>
                      <SelectContent className="w-(--radix-select-trigger-width)">
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            <CountryFlag name={country.name} iso2={country.iso2} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="city-name">Nom</FieldLabel>
                  <FieldContent>
                    <Input
                      id="city-name"
                      value={name}
                      onChange={(event) => {
                        const next = event.target.value;
                        setName(next);
                        setSlug(slugify(next).slice(0, 150));
                      }}
                      required
                      maxLength={120}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="city-slug">Slug</FieldLabel>
                  <FieldContent>
                    <Input
                      id="city-slug"
                      value={slug}
                      onChange={(event) =>
                        setSlug(slugify(event.target.value).slice(0, 150))
                      }
                      required
                      maxLength={150}
                      className="font-mono lowercase"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldTitle>Point unique</FieldTitle>
              <FieldContent>
                <CityPointOsmEditor
                  latitude={latitude}
                  longitude={longitude}
                  onPointChange={({ latitude: lat, longitude: lng }) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  ariaLabel={`Point de ${name || city.name}`}
                />
              </FieldContent>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="city-latitude">Latitude</FieldLabel>
                <FieldContent>
                  <Input
                    id="city-latitude"
                    type="number"
                    step="any"
                    value={latitude ?? ""}
                    onChange={(event) =>
                      setLatitude(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="city-longitude">Longitude</FieldLabel>
                <FieldContent>
                  <Input
                    id="city-longitude"
                    type="number"
                    step="any"
                    value={longitude ?? ""}
                    onChange={(event) =>
                      setLongitude(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </FieldContent>
              </Field>
            </div>
          </CardContent>
        </Card>

        {submitError ? (
          <p className="text-sm text-destructive">{submitError}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={
              saving ||
              !canSubmit ||
              existsLoading ||
              existsFetchError ||
              !existsResult ||
              existsResult.exists
            }
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/city/view/${city.id}`}>Voir le détail</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
