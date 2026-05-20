"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountryGeometryGlobeDrawEditor } from "@/components/admin/country-geometry-globe-draw-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
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
import { apiFetch } from "@/lib/api";
import type { ContinentOption } from "@/types/country.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";

const MLEDOZE_COUNTRIES_JSON =
  "https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/dist/countries.json";
const WORLD_COUNTRIES_GEOJSON =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

type MledozeCountry = {
  cca2?: string;
  cca3?: string;
  name?: {
    common?: string;
    native?: Record<string, { common?: string } | undefined>;
  };
  translations?: { fra?: { common?: string } };
  altSpellings?: string[];
};

type WorldGeoFeature = {
  id?: string;
  geometry?: { type?: string; coordinates?: unknown };
};

type ExistsResponse = {
  exists: boolean;
  conflicts: Array<"iso2" | "iso3" | "name" | "slug">;
  match?: {
    id: string;
    name: string;
    iso2: string;
    iso3: string | null;
  };
};

/** Aligné sur le slug côté API (`name.common` anglais → minuscules, tirets, sans accents). */
function slugFromEnglishCommon(english: string): string {
  const base = english
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (base === "viet-nam") {
    return "vietnam";
  }
  return base;
}

type MledozeSearchDriver = "name" | "slug" | "iso" | null;

function tryMatchBySlug(
  list: MledozeCountry[],
  slugRaw: string,
): MledozeCountry | null {
  const s = slugFromEnglishCommon(slugRaw).trim();
  if (s.length < 2) {
    return null;
  }
  const exactSlug = list.find(
    (c) => slugFromEnglishCommon(c.name?.common ?? "") === s,
  );
  if (exactSlug) {
    return exactSlug;
  }
  const slugCandidates = list.filter((c) => {
    const cs = slugFromEnglishCommon(c.name?.common ?? "");
    if (!cs) {
      return false;
    }
    if (cs.startsWith(s)) {
      return true;
    }
    if (s.length >= 3 && cs.includes(s)) {
      return true;
    }
    return false;
  });
  if (slugCandidates.length === 1) {
    return slugCandidates[0];
  }
  return null;
}

function tryMatchByName(
  list: MledozeCountry[],
  name: string,
): MledozeCountry | null {
  const n = name.trim().toLowerCase();
  if (n.length < 2) {
    return null;
  }
  const exact = list.find(
    (c) =>
      c.name?.common?.toLowerCase() === n ||
      c.translations?.fra?.common?.toLowerCase() === n ||
      c.altSpellings?.some((a) => a.toLowerCase() === n),
  );
  if (exact) {
    return exact;
  }
  const candidates = list.filter(
    (c) =>
      (c.name?.common && c.name.common.toLowerCase().includes(n)) ||
      (c.translations?.fra?.common &&
        c.translations.fra.common.toLowerCase().includes(n)) ||
      c.altSpellings?.some((a) => a.toLowerCase().includes(n)),
  );
  if (candidates.length === 1) {
    return candidates[0];
  }
  return null;
}

function tryMatchByIso(
  list: MledozeCountry[],
  iso2: string,
  iso3: string,
): MledozeCountry | null {
  const i2 = iso2.trim().toUpperCase();
  const i3 = iso3.trim().toUpperCase();
  if (i2.length === 2) {
    const hit = list.find((c) => c.cca2?.toUpperCase() === i2);
    if (hit) {
      return hit;
    }
  }
  if (i3.length === 3) {
    const hit = list.find((c) => c.cca3?.toUpperCase() === i3);
    if (hit) {
      return hit;
    }
  }
  return null;
}

function findMledozeCountry(
  list: MledozeCountry[],
  name: string,
  iso2: string,
  iso3: string,
  slug: string,
  driver: MledozeSearchDriver,
): MledozeCountry | null {
  const steps: Array<"name" | "slug" | "iso"> =
    driver === "slug"
      ? ["slug", "name", "iso"]
      : driver === "iso"
        ? ["iso", "name", "slug"]
        : ["name", "slug", "iso"];

  for (const step of steps) {
    if (step === "slug") {
      const h = tryMatchBySlug(list, slug);
      if (h) {
        return h;
      }
    } else if (step === "name") {
      const h = tryMatchByName(list, name);
      if (h) {
        return h;
      }
    } else {
      const h = tryMatchByIso(list, iso2, iso3);
      if (h) {
        return h;
      }
    }
  }
  return null;
}

function parseGeometryPayload(
  type: string,
  json: string,
):
  | { ok: true; geometry: { type: string; coordinate: unknown } }
  | { ok: false; error: string } {
  const trimmedType = type.trim();
  if (trimmedType !== "Polygon" && trimmedType !== "MultiPolygon") {
    return { ok: false, error: "Le type doit être Polygon ou MultiPolygon." };
  }
  try {
    const coordinate = JSON.parse(json) as unknown;
    return { ok: true, geometry: { type: trimmedType, coordinate } };
  } catch {
    return { ok: false, error: "JSON des coordonnées invalide." };
  }
}

function polygonCoordsToMultiJson(ringsJson: string): string {
  try {
    const p = JSON.parse(ringsJson) as unknown;
    if (!Array.isArray(p)) {
      return "[]";
    }
    return JSON.stringify([p], null, 2);
  } catch {
    return "[]";
  }
}

function multiCoordsToFirstPolygonJson(multiJson: string): string {
  try {
    const polys = JSON.parse(multiJson) as unknown;
    if (!Array.isArray(polys) || polys.length === 0) {
      return "[]";
    }
    return JSON.stringify(polys[0], null, 2);
  } catch {
    return "[]";
  }
}

export function CountryNewForm({
  continents,
}: {
  continents: ContinentOption[];
}) {
  const router = useRouter();
  const [continentId, setContinentId] = useState(continents[0]?.id ?? "");
  const [name, setName] = useState("");
  const [iso2, setiso2] = useState("");
  const [iso3, setiso3] = useState("");
  const [slug, setSlug] = useState("");
  const [searchDriver, setSearchDriver] = useState<MledozeSearchDriver>(null);
  const [englishCommonReference, setEnglishCommonReference] = useState<
    string | null
  >(null);

  const [mledozeList, setMledozeList] = useState<MledozeCountry[] | null>(null);
  const [mledozeError, setMledozeError] = useState<string | null>(null);

  const [geomType, setGeomType] = useState<"Polygon" | "MultiPolygon">(
    "MultiPolygon",
  );
  const [geomJson, setGeomJson] = useState("[]");
  const [geoHint, setGeoHint] = useState<string | null>(null);

  const [existsResult, setExistsResult] = useState<ExistsResponse | null>(null);
  /** Tant que défini (doublon API), on garde l’alerte et on ne relance pas la vérif tant que l’utilisateur n’a pas validé. */
  const [pendingDuplicateAck, setPendingDuplicateAck] =
    useState<ExistsResponse | null>(null);
  const [existsLoading, setExistsLoading] = useState(false);
  const [existsFetchError, setExistsFetchError] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const worldGeoPromiseRef = useRef<Promise<{
    features: WorldGeoFeature[];
  }> | null>(null);
  const existsCheckGenRef = useRef(0);
  const worldGeometrySeededForIso3Ref = useRef<string | null>(null);
  const lastAutoSlugCca3Ref = useRef<string | null>(null);
  const prevResolvedCca3Ref = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(MLEDOZE_COUNTRIES_JSON);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as unknown;
        if (cancelled) {
          return;
        }
        if (!Array.isArray(data)) {
          throw new Error("Format JSON inattendu.");
        }
        setMledozeList(data as MledozeCountry[]);
        setMledozeError(null);
      } catch {
        if (!cancelled) {
          setMledozeError("Impossible de charger la liste des pays (mledoze).");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mledozeList?.length) {
      return;
    }
    const t = window.setTimeout(() => {
      const hit = findMledozeCountry(
        mledozeList,
        name,
        iso2,
        iso3,
        slug,
        searchDriver,
      );
      if (!hit) {
        setEnglishCommonReference(null);
        lastAutoSlugCca3Ref.current = null;
        const identityEmpty =
          !name.trim() &&
          !slug.trim() &&
          iso2.trim().length < 2 &&
          iso3.trim().length < 3;
        if (identityEmpty) {
          prevResolvedCca3Ref.current = null;
          worldGeometrySeededForIso3Ref.current = null;
          setGeomJson("[]");
          setGeoHint(null);
        }
        return;
      }
      const cca3Key = (hit.cca3 ?? "").toUpperCase();
      if (
        cca3Key.length === 3 &&
        prevResolvedCca3Ref.current !== null &&
        prevResolvedCca3Ref.current !== cca3Key
      ) {
        worldGeometrySeededForIso3Ref.current = null;
        setGeomJson("[]");
        setGeoHint(null);
      }
      if (cca3Key.length === 3) {
        prevResolvedCca3Ref.current = cca3Key;
      }
      const enCommon = hit.name?.common?.trim() ?? "";
      setEnglishCommonReference(enCommon || null);
      if (
        enCommon &&
        cca3Key.length === 3 &&
        lastAutoSlugCca3Ref.current !== cca3Key
      ) {
        const nextSlug = slugFromEnglishCommon(enCommon).slice(0, 150);
        if (nextSlug) {
          setSlug(nextSlug);
          lastAutoSlugCca3Ref.current = cca3Key;
        }
      }
      const next2 = (hit.cca2 ?? "").toUpperCase();
      const next3 = (hit.cca3 ?? "").toUpperCase();
      if (next2.length === 2) {
        setiso2(next2);
      }
      if (next3.length === 3) {
        setiso3(next3);
      }
      const displayName =
        hit.translations?.fra?.common ?? hit.name?.common ?? "";
      if (displayName) {
        setName(displayName.slice(0, 120));
      }
    }, 420);
    return () => window.clearTimeout(t);
  }, [name, iso2, iso3, slug, searchDriver, mledozeList]);

  const canCheckExists =
    name.trim().length > 0 &&
    iso2.trim().length === 2 &&
    iso3.trim().length === 3 &&
    slug.trim().length > 0;

  const acknowledgeDuplicateConflict = useCallback(() => {
    existsCheckGenRef.current += 1;
    setPendingDuplicateAck(null);
    setExistsResult(null);
    setExistsFetchError(false);
    setExistsLoading(false);
    setSubmitError(null);
    setContinentId(continents[0]?.id ?? "");
    setName("");
    setiso2("");
    setiso3("");
    setSlug("");
    setSearchDriver(null);
    setEnglishCommonReference(null);
    setGeomType("MultiPolygon");
    setGeomJson("[]");
    setGeoHint(null);
    worldGeometrySeededForIso3Ref.current = null;
    lastAutoSlugCca3Ref.current = null;
    prevResolvedCca3Ref.current = null;
  }, [continents]);

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
            iso2: iso2.trim().toUpperCase(),
            iso3: iso3.trim().toUpperCase(),
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
          });
          const res = await apiFetch(`/api/country/exists?${q.toString()}`);
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
  }, [canCheckExists, name, iso2, iso3, slug, pendingDuplicateAck]);

  const loadWorldGeo = useCallback(async () => {
    if (!worldGeoPromiseRef.current) {
      worldGeoPromiseRef.current = fetch(WORLD_COUNTRIES_GEOJSON).then(
        async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return (await res.json()) as { features: WorldGeoFeature[] };
        },
      );
    }
    return worldGeoPromiseRef.current;
  }, []);

  useEffect(() => {
    const iso3Normalized = iso3.trim().toUpperCase();
    if (iso3Normalized.length !== 3) {
      worldGeometrySeededForIso3Ref.current = null;
      setGeoHint(null);
      return;
    }
    if (!existsResult || existsResult.exists) {
      setGeoHint(null);
      return;
    }
    if (worldGeometrySeededForIso3Ref.current === iso3Normalized) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const payload = await loadWorldGeo();
        if (cancelled) {
          return;
        }
        const feature = (payload.features ?? []).find(
          (f) => String(f.id ?? "").toUpperCase() === iso3Normalized,
        );
        if (
          !feature?.geometry?.type ||
          feature.geometry.coordinates === undefined
        ) {
          const countryLabel =
            name.trim() || englishCommonReference?.trim() || iso3Normalized;
          setGeoHint(
            `Aucune géométrie dans world.geo.json pour « ${countryLabel} ». Veuillez dessiner le tracé du pays sur le globe (outil polygone, barre d’outils en haut à gauche).`,
          );
          return;
        }
        const gType = feature.geometry.type;
        if (gType !== "Polygon" && gType !== "MultiPolygon") {
          const countryLabel =
            name.trim() || englishCommonReference?.trim() || iso3Normalized;
          setGeoHint(
            `Type géométrique « ${gType} » non pris en charge pour « ${countryLabel} ». Dessinez un polygone ou multi-polygone sur le globe.`,
          );
          return;
        }
        worldGeometrySeededForIso3Ref.current = iso3Normalized;
        setGeomType(gType);
        setGeomJson(JSON.stringify(feature.geometry.coordinates, null, 2));
        setGeoHint(null);
      } catch {
        if (!cancelled) {
          setGeoHint("Impossible de charger countries.geo.json.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [iso3, existsResult, loadWorldGeo, name, englishCommonReference]);

  const geometryJsonError = useMemo(() => {
    const parsed = parseGeometryPayload(geomType, geomJson);
    return parsed.ok ? null : parsed.error;
  }, [geomType, geomJson]);

  function onGeometryTypeSelect(next: string) {
    if (next !== "Polygon" && next !== "MultiPolygon") {
      return;
    }
    if (next === geomType) {
      return;
    }
    if (next === "MultiPolygon" && geomType === "Polygon") {
      setGeomJson(polygonCoordsToMultiJson(geomJson));
    } else if (next === "Polygon" && geomType === "MultiPolygon") {
      setGeomJson(multiCoordsToFirstPolygonJson(geomJson));
    }
    setGeomType(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!continentId) {
      setSubmitError("Choisissez un continent.");
      return;
    }
    if (!canCheckExists) {
      setSubmitError(
        "Renseignez le nom, le slug, le code ISO2 (2 lettres) et le code ISO3 (3 lettres).",
      );
      return;
    }
    const slugNormalized = slugFromEnglishCommon(slug).slice(0, 150);
    if (!slugNormalized) {
      setSubmitError(
        "Le slug doit contenir au moins une lettre ou un chiffre.",
      );
      return;
    }
    if (!existsResult || existsFetchError) {
      setSubmitError(
        "Vérifiez les doublons (appel API) avant de créer le pays.",
      );
      return;
    }
    if (existsResult.exists) {
      setSubmitError("Ce pays semble déjà exister en base.");
      return;
    }

    const parsed = parseGeometryPayload(geomType, geomJson);
    if (!parsed.ok) {
      setSubmitError(parsed.error);
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/country", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          iso2: iso2.trim().toUpperCase(),
          iso3: iso3.trim().toUpperCase(),
          slug: slugNormalized,
          continentId,
          geometry: parsed.geometry,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: unknown;
        id?: string;
      };

      if (!res.ok) {
        const raw = data.message;
        const msg =
          typeof raw === "string"
            ? raw
            : Array.isArray(raw)
              ? raw.filter((m) => typeof m === "string").join(", ")
              : `Erreur ${res.status} lors de la création.`;
        setSubmitError(msg);
        return;
      }

      const id =
        typeof data === "object" && data && "id" in data ? String(data.id) : "";
      if (id) {
        router.push(`/admin/country/view/${encodeURIComponent(id)}`);
        toast.success("Pays créé avec succès.");
        return;
      }
      setSubmitError("Réponse API sans identifiant pays.");
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
          {mledozeError || existsFetchError || pendingDuplicateAck?.exists ? (
            <div className="space-y-2 text-sm">
              {mledozeError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{mledozeError}</AlertDescription>
                </Alert>
              ) : null}
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
                        <strong>
                          {pendingDuplicateAck.match.name} (
                          {pendingDuplicateAck.match.iso2}{" "}
                          {pendingDuplicateAck.match.iso3
                            ? ` / ${pendingDuplicateAck.match.iso3}`
                            : ""}
                          )
                        </strong>
                        <span>
                          {" "}
                          existe déjà. Veuillez choisir un autre pays.
                        </span>
                      </p>
                    ) : (
                      <p>Un pays correspondant existe déjà en base.</p>
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
                <FieldLabel htmlFor="new-country-continent">
                  Continent
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={continentId}
                    onValueChange={setContinentId}
                    name="continentId"
                  >
                    <SelectTrigger
                      id="new-country-continent"
                      name="continentId"
                      className="w-full max-w-none"
                    >
                      <SelectValue placeholder="Choisir un continent" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="w-(--radix-select-trigger-width)"
                    >
                      {continents.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="new-country-name">Nom</FieldLabel>
                <FieldContent>
                  <Input
                    id="new-country-name"
                    name="name"
                    value={name}
                    onFocus={() => setSearchDriver("name")}
                    onChange={(ev) => {
                      setSearchDriver("name");
                      setName(ev.target.value);
                    }}
                    required
                    maxLength={120}
                    autoComplete="off"
                    placeholder="Ex. France"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="new-country-iso2">Code ISO2</FieldLabel>
                <FieldContent>
                  <Input
                    id="new-country-iso2"
                    name="iso2"
                    value={iso2}
                    onFocus={() => setSearchDriver("iso")}
                    onChange={(ev) => {
                      setSearchDriver("iso");
                      setiso2(ev.target.value.toUpperCase());
                    }}
                    required
                    maxLength={2}
                    minLength={2}
                    autoComplete="off"
                    placeholder="FR"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="new-country-iso3">Code ISO3</FieldLabel>
                <FieldContent>
                  <Input
                    id="new-country-iso3"
                    name="iso3"
                    value={iso3}
                    onFocus={() => setSearchDriver("iso")}
                    onChange={(ev) => {
                      setSearchDriver("iso");
                      setiso3(ev.target.value.toUpperCase());
                    }}
                    required
                    maxLength={3}
                    minLength={3}
                    autoComplete="off"
                    placeholder="FRA"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="new-country-slug">
                  Slug (URL) - en anglais
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="new-country-slug"
                    name="slug"
                    value={slug}
                    onFocus={() => setSearchDriver("slug")}
                    onChange={(ev) => {
                      setSearchDriver("slug");
                      setSlug(
                        slugFromEnglishCommon(ev.target.value).slice(0, 150),
                      );
                    }}
                    required
                    maxLength={150}
                    autoComplete="off"
                    placeholder="france"
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
          <CardTitle>Géométrie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {geoHint ? (
            <p
              className="text-sm text-amber-600 dark:text-amber-500"
              role="status"
            >
              {geoHint}
            </p>
          ) : null}
          <Field>
            <FieldTitle>Type de géométrie</FieldTitle>
            <FieldContent>
              <Select
                value={geomType}
                onValueChange={onGeometryTypeSelect}
                name="geometryType"
              >
                <SelectTrigger
                  id="new-country-geom-type"
                  name="geometryType"
                  className="w-full max-w-none"
                >
                  <SelectValue placeholder="Type de géométrie" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-(--radix-select-trigger-width)"
                >
                  <SelectItem value="Polygon">Polygon</SelectItem>
                  <SelectItem value="MultiPolygon">MultiPolygon</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field data-invalid={geometryJsonError ? true : undefined}>
            <FieldTitle>Tracé sur le globe 3D</FieldTitle>
            <FieldContent className="space-y-2">
              <CountryGeometryGlobeDrawEditor
                key={`new-${geomType}`}
                geometryType={geomType}
                geomJson={geomJson}
                onGeomJsonChange={setGeomJson}
                ariaLabel={`Nouveau pays - édition géométrie ${name || "pays"} sur le globe`}
              />
              <FieldError>{geometryJsonError}</FieldError>
            </FieldContent>
          </Field>
        </CardContent>
      </Card>

      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={
            saving ||
            !!geometryJsonError ||
            existsLoading ||
            existsFetchError ||
            !existsResult ||
            existsResult.exists
          }
        >
          {saving ? "Création…" : "Créer le pays"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/country">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
