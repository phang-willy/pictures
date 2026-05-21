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
import { cn } from "@/lib/utils";
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
import {
  POST_SHORT_DESCRIPTION_MAX_LEN,
  POST_SHORT_DESCRIPTION_MIN_LEN,
} from "@/lib/post-short-description";
import { normalizeTiptapHtmlForStorage } from "@/lib/tiptap-html";
import { slugify } from "@/domain/utils/slugify";
import type { CityHttpDetail } from "@/types/city.types.ts";
import Tiptap from "@/components/tiptap";

type ExistsResponse = {
  exists: boolean;
  conflicts: Array<"name" | "slug">;
  match?: {
    id: string;
    name: string;
    slug: string;
  };
};

export function PostNewForm({ cities }: { cities: CityHttpDetail[] }) {
  const router = useRouter();
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
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

  const shortDescLen = shortDescription.trim().length;
  const shortDescriptionOk =
    shortDescLen >= POST_SHORT_DESCRIPTION_MIN_LEN &&
    shortDescLen <= POST_SHORT_DESCRIPTION_MAX_LEN;

  const canSubmit = useMemo(
    () =>
      !!cityId &&
      name.trim().length > 0 &&
      slug.trim().length > 0 &&
      shortDescriptionOk &&
      latitude !== null &&
      longitude !== null,
    [
      cityId,
      name,
      slug,
      shortDescriptionOk,
      latitude,
      longitude,
    ],
  );

  const canCheckExists =
    !!cityId && name.trim().length > 0 && slug.trim().length > 0;

  const prevCityIdForMapRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const city = cities.find((c) => c.id === cityId);
    if (!city) {
      return;
    }
    const point = { latitude: city.latitude, longitude: city.longitude };

    if (prevCityIdForMapRef.current === undefined) {
      prevCityIdForMapRef.current = cityId;
      setLatitude((lat) => (lat === null ? point.latitude : lat));
      setLongitude((lng) => (lng === null ? point.longitude : lng));
      return;
    }
    if (prevCityIdForMapRef.current === cityId) {
      return;
    }
    prevCityIdForMapRef.current = cityId;
    setLatitude(point.latitude);
    setLongitude(point.longitude);
  }, [cityId, cities]);

  function acknowledgeDuplicateConflict() {
    existsCheckGenRef.current += 1;
    prevCityIdForMapRef.current = undefined;
    setPendingDuplicateAck(null);
    setExistsResult(null);
    setExistsFetchError(false);
    setExistsLoading(false);
    setSubmitError(null);
    setCityId(cities[0]?.id ?? "");
    setName("");
    setSlug("");
    setShortDescription("");
    setContent("");
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
            city_id: cityId,
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
          });
          const res = await apiFetch(`/api/post/exists?${q.toString()}`);
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
  }, [canCheckExists, cityId, name, slug, pendingDuplicateAck]);

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
        "Vérifiez les doublons (appel API) avant de créer le post.",
      );
      return;
    }
    if (existsResult.exists) {
      setSubmitError(
        "Un post avec ce nom ou ce slug existe déjà pour cette ville.",
      );
      return;
    }
    setSaving(true);
    const normalizedContent = normalizeTiptapHtmlForStorage(content);
    try {
      const res = await apiFetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId,
          name: name.trim(),
          slug: slugify(slug),
          description: shortDescription.trim(),
          content: normalizedContent || null,
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
        toast.success("Post créé avec succès.");
        router.push(`/admin/post/view/${encodeURIComponent(data.id)}`);
        return;
      }
      setSubmitError("Réponse API sans identifiant post.");
    } catch {
      setSubmitError("Impossible de contacter l'API.");
    } finally {
      setSaving(false);
    }
  }

  if (!cities.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune ville active : créez d’abord une ville pour pouvoir ajouter un
        post.
      </p>
    );
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
                          pour cette ville.
                        </span>
                      </p>
                    ) : (
                      <p>Un post correspondant existe déjà pour cette ville.</p>
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
                <FieldLabel htmlFor="new-post-city">Ville</FieldLabel>
                <FieldContent>
                  <Select value={cityId} onValueChange={setCityId}>
                    <SelectTrigger
                      id="new-post-city"
                      className="w-full max-w-none"
                    >
                      <SelectValue placeholder="Choisir une ville" />
                    </SelectTrigger>
                    <SelectContent className="w-(--radix-select-trigger-width) max-h-72">
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          <span className="flex items-center gap-2">
                            <CountryFlag
                              name={city.country.name}
                              iso2={city.country.iso2}
                              show_name={false}
                            />
                            <span className="text-muted-foreground">
                              ({city.country.iso2})
                            </span>
                            <span>{city.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-post-name">Nom</FieldLabel>
                <FieldContent>
                  <Input
                    id="new-post-name"
                    value={name}
                    onChange={(event) => {
                      const next = event.target.value;
                      setName(next);
                      setSlug(slugify(next));
                    }}
                    required
                    maxLength={255}
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-post-slug">Slug</FieldLabel>
                <FieldContent>
                  <Input
                    id="new-post-slug"
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    required
                    maxLength={255}
                    autoComplete="off"
                    className="font-mono lowercase"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-post-short-description">
                  Description (court, obligatoire)
                </FieldLabel>
                <FieldContent className="space-y-1">
                  <textarea
                    id="new-post-short-description"
                    value={shortDescription}
                    onChange={(event) =>
                      setShortDescription(
                        event.target.value.slice(
                          0,
                          POST_SHORT_DESCRIPTION_MAX_LEN,
                        ),
                      )
                    }
                    rows={4}
                    required
                    minLength={POST_SHORT_DESCRIPTION_MIN_LEN}
                    maxLength={POST_SHORT_DESCRIPTION_MAX_LEN}
                    placeholder={`${POST_SHORT_DESCRIPTION_MIN_LEN}-${POST_SHORT_DESCRIPTION_MAX_LEN} caractères (méta / chapô)…`}
                    className={cn(
                      "min-h-[72px] w-full resize-y rounded-lg border border-input bg-card px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
                      shortDescriptionOk || shortDescLen === 0
                        ? ""
                        : "border-destructive",
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    {shortDescription.length}/{POST_SHORT_DESCRIPTION_MAX_LEN}{" "}
                    - obligatoire entre {POST_SHORT_DESCRIPTION_MIN_LEN} et{" "}
                    {POST_SHORT_DESCRIPTION_MAX_LEN} caractères
                  </p>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-post-content">Contenu</FieldLabel>
                <FieldContent>
                  <Tiptap
                    value={content}
                    onChange={setContent}
                    className="min-h-[120px] rounded-lg border border-input bg-card px-2.5 py-2"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position (carte 3D)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldTitle>Point sur le globe</FieldTitle>
            <FieldContent className="space-y-2">
              <CityPointOsmEditor
                latitude={latitude}
                longitude={longitude}
                onPointChange={({ latitude: lat, longitude: lng }) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                ariaLabel={`Nouveau point pour ${name || "le post"}`}
              />
            </FieldContent>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="new-post-latitude">Latitude</FieldLabel>
              <FieldContent>
                <Input
                  id="new-post-latitude"
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
              <FieldLabel htmlFor="new-post-longitude">Longitude</FieldLabel>
              <FieldContent>
                <Input
                  id="new-post-longitude"
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
          {saving ? "Création…" : "Créer le post"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/post">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
