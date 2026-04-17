"use client";

import { useMemo, useState } from "react";
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

export type ContinentOption = { id: string; code: string; name: string };

export type CountryEditInitial = {
  id: string;
  continentId: string;
  name: string;
  codeIso2: string;
  codeIso3: string | null;
  slug: string;
  geometry: AdminGeometryPayload;
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
  country: CountryEditInitial;
  continents: ContinentOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(country.name);
  const [codeIso2, setCodeIso2] = useState(country.codeIso2);
  const [codeIso3, setCodeIso3] = useState(country.codeIso3 ?? "");
  const [slug, setSlug] = useState(country.slug);
  const [continentId, setContinentId] = useState(country.continentId);
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
            codeIso2: codeIso2.trim(),
            codeIso3: codeIso3.trim() === "" ? null : codeIso3.trim(),
            slug: slug.trim(),
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
      router.refresh();
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
                    name="codeIso2"
                    value={codeIso2}
                    onChange={(ev) =>
                      setCodeIso2(ev.target.value.toUpperCase())
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
                    name="codeIso3"
                    value={codeIso3}
                    onChange={(ev) =>
                      setCodeIso3(ev.target.value.toUpperCase())
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
                    onChange={(ev) => setSlug(ev.target.value)}
                    required
                    maxLength={150}
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="country-continent">Continent</FieldLabel>
                <FieldContent>
                  <Select value={continentId} onValueChange={setContinentId}>
                    <SelectTrigger
                      id="country-continent"
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
                          {c.name}
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
              <Select value={geomType} onValueChange={onGeometryTypeSelect}>
                <SelectTrigger
                  id="country-geom-type"
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
        <Button type="submit" disabled={saving || !!geometryJsonError}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/admin/country/view/${country.id}`}>Voir le détail</Link>
        </Button>
      </div>
    </form>
  );
}
