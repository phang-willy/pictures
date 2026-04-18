"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountryGeometryOsmEditor } from "@/components/admin/country-geometry-osm-editor";
import type { AdminGeometryPayload } from "@/components/admin/admin-geometry-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
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
import type { ContinentOption, CountryHttpDetail } from "@/types/admin-country.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";

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

function coordinateJsonInitial(geometry: AdminGeometryPayload): string {
  if (!geometry?.coordinate) {
    return "[]";
  }
  try {
    return JSON.stringify(geometry.coordinate, null, 2);
  } catch {
    return "[]";
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

export function CountryEditForm({
  country,
  continents,
}: {
  country: CountryHttpDetail;
  continents: ContinentOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(country.name);
  const [iso2, setiso2] = useState(country.iso2);
  const [iso3, setiso3] = useState(country.iso3 ?? "");
  const [slug, setSlug] = useState(country.slug);
  const [continentId, setContinentId] = useState(country.continent.id);
  const [geomType, setGeomType] = useState<"Polygon" | "MultiPolygon">(() => {
    const t = country.geometry?.type;
    return t === "Polygon" || t === "MultiPolygon" ? t : "MultiPolygon";
  });
  const [geomJson, setGeomJson] = useState(() =>
    coordinateJsonInitial(country.geometry),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [existsResult, setExistsResult] = useState<ExistsResponse | null>(null);
  const [existsLoading, setExistsLoading] = useState(false);
  const [existsFetchError, setExistsFetchError] = useState(false);
  const existsCheckGenRef = useRef(0);

  const canCheckExists =
    name.trim().length > 0 &&
    iso2.trim().length === 2 &&
    slug.trim().length > 0;

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
            name: name.trim(),
            iso2: iso2.trim().toUpperCase(),
            slug: slug.trim().toLowerCase(),
            exclude_country_id: country.id,
          });
          const i3 = iso3.trim().toUpperCase();
          if (i3.length === 3) {
            q.set("iso3", i3);
          }
          const res = await apiFetch(`/api/country/exists?${q.toString()}`);
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
  }, [canCheckExists, name, iso2, iso3, slug, country.id]);

  const geometryJsonError = useMemo(() => {
    const parsed = parseGeometryPayload(geomType, geomJson);
    return parsed.ok ? null : parsed.error;
  }, [geomType, geomJson]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);

    const parsed = parseGeometryPayload(geomType, geomJson);
    if (!parsed.ok) {
      setSubmitError(parsed.error);
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
        "Un autre pays utilise déjà ce nom, code ISO ou slug.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(
        `/api/country/${encodeURIComponent(country.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            iso2: iso2.trim(),
            iso3: iso3.trim() === "" ? null : iso3.trim(),
            slug: slug.trim().toLowerCase(),
            continentId,
            geometry: parsed.geometry,
          }),
        },
      );

      const data = (await res.json().catch(() => ({}))) as {
        message?: unknown;
      };

      if (!res.ok) {
        const raw = data.message;
        const msg =
          typeof raw === "string"
            ? raw
            : Array.isArray(raw)
              ? raw.filter((m) => typeof m === "string").join(", ")
              : `Erreur ${res.status} lors de l'enregistrement.`;
        setSubmitError(msg);
        return;
      }

      setSuccess(true);
      toast.success("Modifications enregistrées avec succès.");
      router.push(`/admin/country/view/${country.id}`);
    } catch {
      setSubmitError("Impossible de contacter l'API.");
    } finally {
      setSaving(false);
    }
  }

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

  return (
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
                Impossible de vérifier les doublons. Réessayez ou reconnectez-vous.
              </AlertDescription>
            </Alert>
          ) : null}
          {existsResult?.exists ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon />
              <AlertTitle>Conflit</AlertTitle>
              <AlertDescription className="space-y-2">
                {existsResult.match &&
                existsResult.match.id !== country.id ? (
                  <p>
                    <strong>
                      {existsResult.match.name} ({existsResult.match.iso2}
                      {existsResult.match.iso3
                        ? ` / ${existsResult.match.iso3}`
                        : ""}
                      )
                    </strong>{" "}
                    utilise déjà l’un des champs :{" "}
                    {existsResult.conflicts.join(", ")}.
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
                <FieldLabel htmlFor="country-name">Nom</FieldLabel>
                <FieldContent>
                  <Input
                    id="country-name"
                    name="name"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    required
                    maxLength={120}
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="country-iso2">Code ISO 2</FieldLabel>
                <FieldContent>
                  <Input
                    id="country-iso2"
                    name="iso2"
                    value={iso2}
                    onChange={(ev) =>
                      setiso2(ev.target.value.toUpperCase())
                    }
                    required
                    maxLength={2}
                    minLength={2}
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="country-iso3">Code ISO 3</FieldLabel>
                <FieldContent>
                  <Input
                    id="country-iso3"
                    name="iso3"
                    value={iso3}
                    onChange={(ev) =>
                      setiso3(ev.target.value.toUpperCase())
                    }
                    maxLength={3}
                    placeholder="Optionnel"
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="country-slug">Slug</FieldLabel>
                <FieldContent>
                  <Input
                    id="country-slug"
                    name="slug"
                    value={slug}
                    onChange={(ev) =>
                      setSlug(ev.target.value.trim().toLowerCase())
                    }
                    required
                    maxLength={150}
                    autoComplete="off"
                    className="font-mono lowercase"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="country-continent">Continent</FieldLabel>
                <FieldContent>
                  <Select value={continentId} onValueChange={setContinentId} name="continentId">
                    <SelectTrigger
                      id="country-continent"
                      name="continentId"
                      className="w-full max-w-none"
                      size="default"
                    >
                      <SelectValue placeholder="Choisir un continent" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="w-(--radix-select-trigger-width)"
                    >
                      {continents.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <Field>
            <FieldTitle>Type</FieldTitle>
            <FieldDescription>
              En mode <strong className="font-medium">Polygon</strong>, un seul
              polygone est conservé. En mode{" "}
              <strong className="font-medium">MultiPolygon</strong>, vous pouvez
              en dessiner plusieurs.
            </FieldDescription>
            <FieldContent>
              <Select value={geomType} onValueChange={onGeometryTypeSelect} name="geomType">
                <SelectTrigger
                  id="country-geom-type"
                  name="geomType"
                  className="w-full max-w-none"
                  aria-invalid={geometryJsonError ? true : undefined}
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
            <FieldTitle>Carte</FieldTitle>
            <FieldDescription>
              Utilisez la barre d&apos;outils en haut à gauche : polygone pour
              dessiner, crayon pour déplacer les sommets, corbeille pour
              supprimer une forme sélectionnée.
            </FieldDescription>
            <FieldContent className="space-y-2">
              <CountryGeometryOsmEditor
                key={`${country.id}-${geomType}`}
                geometryType={geomType}
                geomJson={geomJson}
                onGeomJsonChange={setGeomJson}
                ariaLabel={`Édition géométrie ${name || country.name} sur OpenStreetMap`}
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
      {success ? (
        <p className="text-sm text-muted-foreground">
          Modifications enregistrées.
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
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/admin/country/view/${country.id}`}>Voir le détail</Link>
        </Button>
      </div>
    </form>
  );
}
