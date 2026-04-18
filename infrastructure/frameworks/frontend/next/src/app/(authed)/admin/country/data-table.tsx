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
import { CountryNameWithFlag } from "@/components/admin/country-name-with-flag";
import {
  ApiDataTable,
  type LoadPageArgs,
} from "@/components/data-table";
import { DATA_TABLE_DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import type { CountryRow } from "@pictures/contracts";
import { parsePaginatedCountryListResponse } from "@pictures/contracts";
import {
  createActiveCountryColumns,
  createDeactivatedCountryColumns,
} from "./columns";

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

export function CountryAdmin() {
  const [listsVersion, setListsVersion] = useState(0);

  const [countryToDelete, setCountryToDelete] = useState<CountryRow | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [countryToActivate, setCountryToActivate] = useState<CountryRow | null>(
    null,
  );
  const [activateSubmitting, setActivateSubmitting] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const columnsActive = useMemo(
    () =>
      createActiveCountryColumns(
        {
          onRequestDelete: (country) => {
            setDeleteError(null);
            setCountryToDelete(country);
          },
        },
        { sortableHeaders: false },
      ),
    [],
  );

  const columnsDeactivated = useMemo(
    () =>
      createDeactivatedCountryColumns(
        {
          onRequestReactivate: (country) => {
            setActivateError(null);
            setCountryToActivate(country);
          },
        },
        { sortableHeaders: false },
      ),
    [],
  );

  const loadActivePage = useCallback(async (args: LoadPageArgs) => {
    const params = new URLSearchParams({
      page: String(args.page),
      per_page: String(args.pageSize),
    });
    if (args.query) {
      params.set("q", args.query);
    }
    const res = await apiFetch(`/api/country?${params.toString()}`);
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: parseApiErrorMessage(json, res.status) };
    }
    const { items, pagination } = parsePaginatedCountryListResponse(json);
    if (!pagination) {
      return { error: "Réponse API invalide (pagination)." };
    }
    return { rows: items, pagination };
  }, []);

  const loadDeactivatedPage = useCallback(async (args: LoadPageArgs) => {
    const params = new URLSearchParams({
      page: String(args.page),
      per_page: String(args.pageSize),
      inactive_only: "true",
    });
    if (args.query) {
      params.set("q", args.query);
    }
    const res = await apiFetch(`/api/country?${params.toString()}`);
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: parseApiErrorMessage(json, res.status) };
    }
    const { items, pagination } = parsePaginatedCountryListResponse(json);
    if (!pagination) {
      return { error: "Réponse API invalide (pagination)." };
    }
    return { rows: items, pagination };
  }, []);

  const bumpLists = useCallback(() => {
    setListsVersion((v) => v + 1);
  }, []);

  async function confirmSoftDelete() {
    if (!countryToDelete) {
      return;
    }
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(
        `/api/country/${encodeURIComponent(countryToDelete.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deletedAt: new Date().toISOString() }),
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
              : `Erreur ${res.status}.`;
        setDeleteError(msg);
        return;
      }
      setCountryToDelete(null);
      bumpLists();
    } catch {
      setDeleteError("Impossible de contacter l'API.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function confirmReactivate() {
    if (!countryToActivate) {
      return;
    }
    setActivateSubmitting(true);
    setActivateError(null);
    try {
      const res = await apiFetch(
        `/api/country/${encodeURIComponent(countryToActivate.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deletedAt: null }),
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
              : `Erreur ${res.status}.`;
        setActivateError(msg);
        return;
      }
      setCountryToActivate(null);
      bumpLists();
    } catch {
      setActivateError("Impossible de contacter l'API.");
    } finally {
      setActivateSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Liste des pays</h1>
        <Button asChild>
          <Link href="/admin/country/new">
            <span className="flex items-center gap-2">
              <PlusIcon className="size-4" />
              <span>Ajouter</span>
            </span>
          </Link>
        </Button>
      </div>

      <div>
            <ApiDataTable
              title="Pays actifs"
              columns={columnsActive}
              emptyMessage="Aucun pays actif."
              loadPage={loadActivePage}
              search={{
                placeholder: "Rechercher dans les pays actifs...",
                ariaLabel: "Recherche pays actifs",
                name: "search-country-active",
              }}
              pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
              refreshSignal={listsVersion}
            />

            <Dialog
              open={countryToDelete !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setCountryToDelete(null);
                  setDeleteError(null);
                  setDeleteSubmitting(false);
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Supprimer ce pays ?</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground">
                      {countryToDelete ? (
                        <>
                          <p>
                            <span className="font-medium text-foreground flex items-center gap-0.5">
                              <CountryNameWithFlag
                                name={countryToDelete.name}
                                iso2={countryToDelete.iso2}
                                className="flex items-center gap-0.5"
                              />
                              <span>({countryToDelete.iso2})</span>
                            </span>
                          </p>
                          <p>
                            <span>
                              Ce pays sera marqué comme supprimé et ne sera plus
                              visible dans la liste des pays actifs.
                            </span>
                          </p>
                          <p>
                            <span>
                              Vous pourrez le réactiver plus tard depuis la liste
                              des pays désactivés.
                            </span>
                          </p>
                        </>
                      ) : null}
                    </div>
                  </DialogDescription>
                </DialogHeader>
                {deleteError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {deleteError}
                  </p>
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
                    onClick={() => void confirmSoftDelete()}
                  >
                    {deleteSubmitting ? "Suppression…" : "Supprimer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
      </div>

      <div>
            <ApiDataTable
              title="Pays désactivés"
              columns={columnsDeactivated}
              emptyMessage="Aucun pays désactivé."
              loadPage={loadDeactivatedPage}
              search={{
                placeholder: "Rechercher dans les pays supprimes...",
                ariaLabel: "Recherche pays supprimes",
                name: "search-country-deactivated",
              }}
              pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
              refreshSignal={listsVersion}
            />

            <Dialog
              open={countryToActivate !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setCountryToActivate(null);
                  setActivateError(null);
                  setActivateSubmitting(false);
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Réactiver ce pays ?</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground">
                      {countryToActivate ? (
                        <>
                          <p>
                            <span className="font-medium text-foreground flex items-center gap-0.5">
                              <CountryNameWithFlag
                                name={countryToActivate.name}
                                iso2={countryToActivate.iso2}
                                className="flex items-center gap-0.5"
                              />
                              <span> ({countryToActivate.iso2}) </span>
                            </span>
                          </p>
                          <p>
                            <span>
                              Ce pays sera de nouveau disponible dans la liste des
                              pays actifs.
                            </span>
                          </p>
                        </>
                      ) : null}
                    </div>
                  </DialogDescription>
                </DialogHeader>
                {activateError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {activateError}
                  </p>
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
                    onClick={() => void confirmReactivate()}
                  >
                    {activateSubmitting ? "Réactivation…" : "Réactiver"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
      </div>
    </div>
  );
}
