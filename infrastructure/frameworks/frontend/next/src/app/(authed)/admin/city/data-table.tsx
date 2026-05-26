"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiDataTable, type LoadPageArgs } from "@/components/data-table";
import { DATA_TABLE_DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import type { ApiPagination } from "@pictures/contracts";
import {
  CityRow,
  createActiveCityColumns,
  createDeactivatedCityColumns,
} from "./columns";

type PaginatedResponse = {
  items?: unknown;
  pagination?: unknown;
};

function parseApiErrorMessage(json: unknown, status: number): string {
  if (json && typeof json === "object" && "message" in json) {
    const raw = (json as { message?: unknown }).message;
    if (typeof raw === "string") {
      return raw;
    }
    if (Array.isArray(raw)) {
      return raw.filter((m) => typeof m === "string").join(", ");
    }
  }
  return `Erreur ${status}.`;
}

function isApiPagination(value: unknown): value is ApiPagination {
  if (!value || typeof value !== "object") {
    return false;
  }
  const p = value as Record<string, unknown>;
  return (
    typeof p.current_page === "number" &&
    typeof p.per_page === "number" &&
    typeof p.total === "number" &&
    typeof p.total_pages === "number" &&
    typeof p.has_prev === "boolean" &&
    typeof p.has_next === "boolean"
  );
}

export function CityAdmin() {
  const [listsVersion, setListsVersion] = useState(0);
  const [cityToDesactivate, setCityToDesactivate] = useState<CityRow | null>(null);
  const [deactivateSubmitting, setDesactivateSubmitting] = useState(false);
  const [deactivateError, setDesactivateError] = useState<string | null>(null);
  const [cityToActivate, setCityToActivate] = useState<CityRow | null>(null);
  const [activateSubmitting, setActivateSubmitting] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [cityToDelete, setCityToDelete] = useState<CityRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columnsActive = useMemo(
    () =>
      createActiveCityColumns(
        { onRequestDesactivate: (city) => setCityToDesactivate(city) },
        { sortableHeaders: true },
      ),
    [],
  );

  const columnsDeactivated = useMemo(
    () =>
      createDeactivatedCityColumns(
        {
          onRequestActivate: (city) => setCityToActivate(city),
          onRequestDelete: (city) => setCityToDelete(city),
        },
        { sortableHeaders: true },
      ),
    [],
  );

  const parsePageResponse = (json: unknown) => {
    const payload = (json ?? {}) as PaginatedResponse;
    if (!Array.isArray(payload.items) || !isApiPagination(payload.pagination)) {
      return null;
    }
    return {
      rows: payload.items as CityRow[],
      pagination: payload.pagination,
    };
  };

  const loadActivePage = useCallback(async (args: LoadPageArgs) => {
    const params = new URLSearchParams({
      page: String(args.page),
      per_page: String(args.pageSize),
    });
    const res = await apiFetch(`/api/city?${params.toString()}`);
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: parseApiErrorMessage(json, res.status) };
    }
    const parsed = parsePageResponse(json);
    if (!parsed) {
      return { error: "Réponse API invalide (pagination)." };
    }
    return parsed;
  }, []);

  const loadDeactivatedPage = useCallback(async (args: LoadPageArgs) => {
    const params = new URLSearchParams({
      page: String(args.page),
      per_page: String(args.pageSize),
      inactive_only: "true",
    });
    const res = await apiFetch(`/api/city?${params.toString()}`);
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: parseApiErrorMessage(json, res.status) };
    }
    const parsed = parsePageResponse(json);
    if (!parsed) {
      return { error: "Réponse API invalide (pagination)." };
    }
    return parsed;
  }, []);

  const bumpLists = useCallback(() => setListsVersion((v) => v + 1), []);

  async function confirmDesactivate() {
    if (!cityToDesactivate) {
      return;
    }
    setDesactivateSubmitting(true);
    setDesactivateError(null);
    try {
      const res = await apiFetch(
        `/api/city/${encodeURIComponent(cityToDesactivate.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deactivatedAt: new Date().toISOString() }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        message?: unknown;
      };
      if (!res.ok) {
        const raw = data.message;
        setDesactivateError(typeof raw === "string" ? raw : `Erreur ${res.status}.`);
        return;
      }
      setCityToDesactivate(null);
      bumpLists();
    } catch {
      setDesactivateError("Impossible de contacter l'API.");
    } finally {
      setDesactivateSubmitting(false);
    }
  }

  async function confirmActivate() {
    if (!cityToActivate) {
      return;
    }
    setActivateSubmitting(true);
    setActivateError(null);
    try {
      const res = await apiFetch(
        `/api/city/${encodeURIComponent(cityToActivate.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deactivatedAt: null }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        message?: unknown;
      };
      if (!res.ok) {
        const raw = data.message;
        setActivateError(
          typeof raw === "string" ? raw : `Erreur ${res.status}.`,
        );
        return;
      }
      setCityToActivate(null);
      bumpLists();
    } catch {
      setActivateError("Impossible de contacter l'API.");
    } finally {
      setActivateSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!cityToDelete) {
      return;
    }
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/city/${encodeURIComponent(cityToDelete.id)}`, {
        method: "DELETE",
      });
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
              : `Erreur ${res.status}.`;
        setDeleteError(msg);
        return;
      }
      setCityToDelete(null);
      bumpLists();
    } catch {
      setDeleteError("Impossible de contacter l'API.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <>
      <section className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Liste des villes</h1>
        <Button asChild>
          <Link href="/admin/city/new">
            <span className="flex items-center gap-2">
              <PlusIcon className="size-4" />
              <span>Ajouter</span>
            </span>
          </Link>
        </Button>
      </section>

      <ApiDataTable
        title="Villes actives"
        columns={columnsActive}
        emptyMessage="Aucune ville active."
        search={{
          placeholder: "Rechercher dans les villes actives...",
          ariaLabel: "Recherche villes actives",
          name: "search-city-active",
        }}
        loadPage={loadActivePage}
        pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
        refreshSignal={listsVersion}
      />

      <ApiDataTable
        title="Villes désactivées"
        columns={columnsDeactivated}
        emptyMessage="Aucune ville désactivée."
        search={{
          placeholder: "Rechercher dans les villes désactivées...",
          ariaLabel: "Recherche villes désactivées",
          name: "search-city-inactive",
        }}
        loadPage={loadDeactivatedPage}
        pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
        refreshSignal={listsVersion}
      />

      <Dialog
        open={cityToDesactivate !== null}
        onOpenChange={(open) => !open && setCityToDesactivate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Désactiver cette ville ?</DialogTitle>
            <DialogDescription>
              {cityToDesactivate
                ? `La ville « ${cityToDesactivate.name} » sera marquée comme désactivée.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {deactivateError ? (
            <p className="text-sm text-destructive">{deactivateError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={deactivateSubmitting}
              >
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={deactivateSubmitting}
              onClick={() => void confirmDesactivate()}
            >
              {deactivateSubmitting ? "Désactivation…" : "Désactiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cityToActivate !== null}
        onOpenChange={(open) => !open && setCityToActivate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réactiver cette ville ?</DialogTitle>
            <DialogDescription>
              {cityToActivate
                ? `La ville « ${cityToActivate.name} » redeviendra active.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {activateError ? (
            <p className="text-sm text-destructive">{activateError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={activateSubmitting}
              >
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={activateSubmitting}
              onClick={() => void confirmActivate()}
            >
              {activateSubmitting ? "Réactivation…" : "Réactiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cityToDelete !== null}
        onOpenChange={(open) => !open && setCityToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer définitivement cette ville ?</DialogTitle>
            <DialogDescription>
              {cityToDelete
                ? `Cette action est irréversible pour « ${cityToDelete.name} ». Les enfants ne seront pas supprimés : seul le lien sera retiré.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={deleteSubmitting}
              >
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteSubmitting}
              onClick={() => void confirmDelete()}
            >
              {deleteSubmitting ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
