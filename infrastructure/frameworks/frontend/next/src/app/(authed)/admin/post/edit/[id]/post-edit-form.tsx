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
import type { PostHttpDetail } from "@/types/post.types";
import type { CityHttpDetail } from "@/types/city.types.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import {
  POST_SHORT_DESCRIPTION_MAX_LEN,
  POST_SHORT_DESCRIPTION_MIN_LEN,
} from "@/lib/post-short-description";
import { normalizeTiptapHtmlForStorage } from "@/lib/tiptap-html";
import { slugify } from "@/domain/utils/slugify";
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

function parseCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

export function PostEditForm({
  post,
  cities,
}: {
  post: PostHttpDetail;
  cities: CityHttpDetail[];
}) {
  const router = useRouter();
  const [cityId, setCityId] = useState(post.city.id);
  const [name, setName] = useState(post.name);
  const [slug, setSlug] = useState(post.slug);
  const [shortDescription, setShortDescription] = useState(
    post.description ?? "",
  );
  const [content, setContent] = useState(post.content ?? "");
  const [latitude, setLatitude] = useState<number | null>(() =>
    parseCoord(post.latitude),
  );
  const [longitude, setLongitude] = useState<number | null>(() =>
    parseCoord(post.longitude),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [existsResult, setExistsResult] = useState<ExistsResponse | null>(null);
  const [existsLoading, setExistsLoading] = useState(false);
  const [existsFetchError, setExistsFetchError] = useState(false);
  const existsCheckGenRef = useRef(0);

  const shortDescLen = shortDescription.trim().length;
  const shortDescriptionOk =
    shortDescLen === 0 ||
    (shortDescLen >= POST_SHORT_DESCRIPTION_MIN_LEN &&
      shortDescLen <= POST_SHORT_DESCRIPTION_MAX_LEN);

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
    if (prevCityIdForMapRef.current === undefined) {
      prevCityIdForMapRef.current = cityId;
      return;
    }
    if (prevCityIdForMapRef.current === cityId) {
      return;
    }
    prevCityIdForMapRef.current = cityId;
    const city = cities.find((c) => c.id === cityId);
    if (!city) {
      return;
    }
    setLatitude(city.latitude);
    setLongitude(city.longitude);
  }, [cityId, cities]);

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
            city_id: cityId,
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            exclude_post_id: post.id,
          });
          const res = await apiFetch(`/api/post/exists?${q.toString()}`);
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
  }, [canCheckExists, cityId, name, slug, post.id]);

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
        "Un autre post utilise déjà ce nom ou ce slug pour cette ville.",
      );
      return;
    }
    setSaving(true);
    const normalizedContent = normalizeTiptapHtmlForStorage(content);
    try {
      const res = await apiFetch(`/api/post/${encodeURIComponent(post.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId,
          name: name.trim(),
          slug: slugify(slug),
          description:
            shortDescription.trim().length === 0
              ? null
              : shortDescription.trim(),
          content: normalizedContent || null,
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
      router.push(`/admin/post/view/${encodeURIComponent(post.id)}`);
    } catch {
      setSubmitError("Impossible de contacter l'API.");
    } finally {
      setSaving(false);
    }
  }

  if (!cities.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune ville active : impossible d’éditer le rattachement ville.
      </p>
    );
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
                  {existsResult.match && existsResult.match.id !== post.id ? (
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
                  <FieldLabel htmlFor="post-city">Ville</FieldLabel>
                  <FieldContent>
                    <Select value={cityId} onValueChange={setCityId}>
                      <SelectTrigger
                        id="post-city"
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
                  <FieldLabel htmlFor="post-name">Nom</FieldLabel>
                  <FieldContent>
                    <Input
                      id="post-name"
                      value={name}
                      onChange={(event) => {
                        const next = event.target.value;
                        setName(next);
                        setSlug(slugify(next).slice(0, 255));
                      }}
                      required
                      maxLength={255}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="post-slug">Slug</FieldLabel>
                  <FieldContent>
                    <Input
                      id="post-slug"
                      value={slug}
                      onChange={(event) =>
                        setSlug(slugify(event.target.value).slice(0, 255))
                      }
                      required
                      maxLength={255}
                      className="font-mono lowercase"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="post-short-description">
                    Description (court)
                  </FieldLabel>
                  <FieldContent className="space-y-1">
                    <textarea
                      id="post-short-description"
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
                      maxLength={POST_SHORT_DESCRIPTION_MAX_LEN}
                      placeholder={`${POST_SHORT_DESCRIPTION_MIN_LEN}-${POST_SHORT_DESCRIPTION_MAX_LEN} caractères si renseignée …`}
                      className={cn(
                        "min-h-18 w-full resize-y rounded-lg border border-input bg-card px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
                        shortDescriptionOk ? "" : "border-destructive",
                      )}
                    />
                    <p className="text-muted-foreground text-xs">
                      {shortDescription.length}/{POST_SHORT_DESCRIPTION_MAX_LEN}{" "}
                      - vide autorisé ; sinon entre {POST_SHORT_DESCRIPTION_MIN_LEN}{" "}
                      et {POST_SHORT_DESCRIPTION_MAX_LEN} caractères
                    </p>
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Contenu</FieldLabel>
                  <FieldContent>
                    <Tiptap
                      value={content}
                      onChange={setContent}
                      className="min-h-30 rounded-lg border border-input bg-card px-2.5 py-2"
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
              <FieldContent>
                <CityPointOsmEditor
                  latitude={latitude}
                  longitude={longitude}
                  onPointChange={({ latitude: lat, longitude: lng }) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  ariaLabel={`Point de ${name || post.name}`}
                />
              </FieldContent>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="post-latitude">Latitude</FieldLabel>
                <FieldContent>
                  <Input
                    id="post-latitude"
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
                <FieldLabel htmlFor="post-longitude">Longitude</FieldLabel>
                <FieldContent>
                  <Input
                    id="post-longitude"
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
            <Link href={`/admin/post/view/${post.id}`}>Voir le détail</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
