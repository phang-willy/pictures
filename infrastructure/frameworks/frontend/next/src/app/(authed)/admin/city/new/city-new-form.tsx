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
import { CountryFlag } from "@/components/country-flag";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
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

export function CityNewForm({
  countries,
}: {
  countries: Array<
    CountryOption & { geometry?: { type: string; coordinate: unknown } | null }
  >;
}) {
  const router = useRouter();
  const [countryId, setCountryId] = useState(countries[0]?.id ?? "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [existsResult, setExistsResult] = useState<ExistsResponse | null>(null);
  const [pendingDuplicateAck, setPendingDuplicateAck] =
    useState<ExistsResponse | null>(null);
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

  const prevCountryIdForMapRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const country = countries.find((c) => c.id === countryId);
    const point = centerFromCountryGeometry(country?.geometry ?? null);

    if (prevCountryIdForMapRef.current === undefined) {
      prevCountryIdForMapRef.current = countryId;
      if (point) {
        setLatitude((lat) => (lat === null ? point.latitude : lat));
        setLongitude((lng) => (lng === null ? point.longitude : lng));
      }
      return;
    }
    if (prevCountryIdForMapRef.current === countryId) {
      return;
    }
    prevCountryIdForMapRef.current = countryId;
    if (!point) {
      return;
    }
    setLatitude(point.latitude);
    setLongitude(point.longitude);
  }, [countryId, countries]);

  function acknowledgeDuplicateConflict() {
    existsCheckGenRef.current += 1;
    prevCountryIdForMapRef.current = undefined;
    setPendingDuplicateAck(null);
    setExistsResult(null);
    setExistsFetchError(false);
    setExistsLoading(false);
    setSubmitError(null);
    setCountryId(countries[0]?.id ?? "");
    setName("");
    setSlug("");
    setLatitude(null);
    setLongitude(null);
  }

  useEffect(() => {
    if (pendingDuplicateAck) {
      return;
    }
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
          });
          const res = await apiFetch(`/api/city/exists?${q.toString()}`);
          const data = (await res.json().catch(() => ({}))) as ExistsResponse;
          if (gen !== existsCheckGenRef.current) {
            return;
          }
          if (!res.ok) {
            setExistsResult(null);
            setPendingDuplicateAck(null);
            setExistsFetchError(true);
            return;
          }
          setExistsFetchError(false);
          setExistsResult(data);
          if (data.exists) {
            setPendingDuplicateAck(data);
          } else {
            setPendingDuplicateAck(null);
          }
        } catch {
          if (gen !== existsCheckGenRef.current) {
            return;
          }
          setExistsResult(null);
          setPendingDuplicateAck(null);
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
  }, [canCheckExists, countryId, name, slug, pendingDuplicateAck]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!canSubmit || latitude === null || longitude === null) {
      setSubmitError(
        "Renseignez tous les champs et placez un point sur la carte.",
      );
      return;
    }
    if (!existsResult || existsFetchError) {
      setSubmitError(
        "Vérifiez les doublons (appel API) avant de créer la ville.",
      );
      return;
    }
    if (existsResult.exists) {
      setSubmitError(
        "Une ville avec ce nom ou ce slug existe déjà dans ce pays.",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/city", {
        method: "POST",
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
        id?: string;
        message?: unknown;
      };
      if (!res.ok) {
        setSubmitError(
          typeof data.message === "string"
            ? data.message
            : `Erreur ${res.status} lors de la création.`,
        );
        return;
      }
      if (data.id) {
        toast.success("Ville créée avec succès.");
        router.push(`/admin/city/view/${encodeURIComponent(data.id)}`);
        return;
      }
      setSubmitError("Réponse API sans identifiant ville.");
    } catch {
      setSubmitError("Impossible de contacter l'API.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {existsFetchError || pendingDuplicateAck?.exists ? (
            <div className="space-y-2 text-sm">
              {existsFetchError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>
                    Impossible de vérifier les doublons. Réessayez ou
                    reconnectez-vous.
                  </AlertDescription>
                </Alert>
              ) : null}
              {pendingDuplicateAck?.exists ? (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Doublon</AlertTitle>
                  <AlertDescription className="space-y-3">
                    {pendingDuplicateAck.match ? (
                      <p>
                        <strong>{pendingDuplicateAck.match.name}</strong>
                        <span>
                          {" "}
                          (slug: {pendingDuplicateAck.match.slug}) existe déjà
                          dans ce pays.
                        </span>
                      </p>
                    ) : (
                      <p>Une ville correspondante existe déjà dans ce pays.</p>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={acknowledgeDuplicateConflict}
                    >
                      Compris - vider le formulaire
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-city-country">Pays</FieldLabel>
                <FieldContent>
                  <Select value={countryId} onValueChange={setCountryId}>
                    <SelectTrigger
                      id="new-city-country"
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
                <FieldLabel htmlFor="new-city-name">Nom</FieldLabel>
                <FieldContent>
                  <Input
                    id="new-city-name"
                    value={name}
                    onChange={(event) => {
                      const next = event.target.value;
                      setName(next);
                      setSlug(slugify(next));
                    }}
                    required
                    maxLength={120}
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-city-slug">Slug</FieldLabel>
                <FieldContent>
                  <Input
                    id="new-city-slug"
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    required
                    maxLength={150}
                    autoComplete="off"
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
            <FieldContent className="space-y-2">
              <CityPointOsmEditor
                latitude={latitude}
                longitude={longitude}
                onPointChange={({ latitude: lat, longitude: lng }) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                ariaLabel={`Nouveau point pour ${name || "la ville"}`}
              />
            </FieldContent>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="new-city-latitude">Latitude</FieldLabel>
              <FieldContent>
                <Input
                  id="new-city-latitude"
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
              <FieldLabel htmlFor="new-city-longitude">Longitude</FieldLabel>
              <FieldContent>
                <Input
                  id="new-city-longitude"
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
          {saving ? "Création…" : "Créer la ville"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/city">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
