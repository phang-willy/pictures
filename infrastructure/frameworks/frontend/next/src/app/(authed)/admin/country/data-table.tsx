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
import { CountryFlag } from "@/components/country-flag";
import { ApiDataTable, type LoadPageArgs } from "@/components/data-table";
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

  const [countryToDesactivate, setCountryToDesactivate] = useState<CountryRow | null>(
    null,
  );
  const [deactivateSubmitting, setDesactivateSubmitting] = useState(false);
  const [deactivateError, setDesactivateError] = useState<string | null>(null);

  const [countryToActivate, setCountryToActivate] = useState<CountryRow | null>(
    null,
  );
  const [activateSubmitting, setActivateSubmitting] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [countryToDelete, setCountryToDelete] = useState<CountryRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columnsActive = useMemo(
    () =>
      createActiveCountryColumns(
        {
          onRequestDesactivate: (country) => {
            setDesactivateError(null);
            setCountryToDesactivate(country);
          },
        },
        { sortableHeaders: true },
      ),
    [],
  );

  const columnsDeactivated = useMemo(
    () =>
      createDeactivatedCountryColumns(
        {
          onRequestActivate: (country) => {
            setActivateError(null);
            setCountryToActivate(country);
          },
          onRequestDelete: (country) => {
            setDeleteError(null);
            setCountryToDelete(country);
          },
        },
        { sortableHeaders: true },
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

  async function confirmDesactivate() {
    if (!countryToDesactivate) {
      return;
    }
    setDesactivateSubmitting(true);
    setDesactivateError(null);
    try {
      const res = await apiFetch(
        `/api/country/${encodeURIComponent(countryToDesactivate.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deactivatedAt: new Date().toISOString() }),
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
        setDesactivateError(msg);
        return;
      }
      setCountryToDesactivate(null);
      bumpLists();
    } catch {
      setDesactivateError("Impossible de contacter l'API.");
    } finally {
      setDesactivateSubmitting(false);
    }
  }

  async function confirmReactivate() {
    if (!countryToActivate) {
      return;
    }
    setActivateSubmitting(true);
    setActivateError(null);
    try {
      await apiFetch(
        `/api/country/${encodeURIComponent(countryToActivate.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deactivatedAt: null }),
        },
      );
      setCountryToActivate(null);
      bumpLists();
    } catch {
      setActivateError("Impossible de contacter l'API.");
    } finally {
      setActivateSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!countryToDelete) {
      return;
    }
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(
        `/api/country/${encodeURIComponent(countryToDelete.id)}`,
        { method: "DELETE" },
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
  return (
    <>
      <section className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Liste des pays</h1>
        <Button asChild>
          <Link href="/admin/country/new">
            <span className="flex items-center gap-2">
              <PlusIcon className="size-4" />
              <span>Ajouter</span>
            </span>
          </Link>
        </Button>
      </section>

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
        open={countryToDesactivate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCountryToDesactivate(null);
            setDesactivateError(null);
            setDesactivateSubmitting(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Désactiver ce pays ?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground">
                {countryToDesactivate ? (
                  <>
                    <p>
                      <span className="font-medium text-foreground flex items-center gap-0.5">
                        <CountryFlag
                          name={countryToDesactivate.name}
                          iso2={countryToDesactivate.iso2}
                          show_name
                        />
                        <span>({countryToDesactivate.iso2})</span>
                      </span>
                    </p>
                    <p>
                      <span>Ce pays sera marqué comme désactivé.</span>
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
          {deactivateError ? (
            <p className="text-sm text-destructive" role="alert">
              {deactivateError}
            </p>
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
                        <CountryFlag
                          name={countryToActivate.name}
                          iso2={countryToActivate.iso2}
                          show_name
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
            <DialogTitle>Supprimer définitivement ce pays ?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {countryToDelete ? (
                  <>
                    <p>
                      <span className="font-medium text-foreground flex items-center gap-0.5">
                        <CountryFlag
                          name={countryToDelete.name}
                          iso2={countryToDelete.iso2}
                          show_name
                        />
                        <span> ({countryToDelete.iso2}) </span>
                      </span>
                    </p>
                    <p>
                      <span>
                        Ce pays sera supprimé définitivement.
                      </span>
                    </p>
                  </>
                ) : null}
                <p>
                  <span>
                    Cette action est irréversible.
                  </span>
                </p>
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
