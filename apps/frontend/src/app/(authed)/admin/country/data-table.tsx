"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  DataTable,
  DATA_TABLE_DEFAULT_PAGE_SIZE,
} from "@/components/ui/data-table";
import type { CountryRow } from "@shared/schemas";
import {
  countryGlobalFilterFn,
  createActiveCountryColumns,
  createDeactivatedCountryColumns,
} from "./columns";

type CountryAdminProps = {
  initialCountries: CountryRow[];
  loadError: string | null;
};

export function CountryAdmin({
  initialCountries,
  loadError,
}: CountryAdminProps) {
  const router = useRouter();
  const [countries, setCountries] = useState(initialCountries);

  useEffect(() => {
    setCountries(initialCountries);
  }, [initialCountries]);

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

  const activeCountries = useMemo(
    () => countries.filter((country) => !country.deletedAt),
    [countries],
  );

  const deactivatedCountries = useMemo(
    () => countries.filter((country) => Boolean(country.deletedAt)),
    [countries],
  );

  const columnsActive = useMemo(
    () =>
      createActiveCountryColumns({
        onRequestDelete: (country) => {
          setDeleteError(null);
          setCountryToDelete(country);
        },
      }),
    [],
  );

  const columnsDeactivated = useMemo(
    () =>
      createDeactivatedCountryColumns({
        onRequestReactivate: (country) => {
          setActivateError(null);
          setCountryToActivate(country);
        },
      }),
    [],
  );

  const refresh = useCallback(async () => {
    await router.refresh();
  }, [router]);

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
      await refresh();
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
      await refresh();
    } catch {
      setActivateError("Impossible de contacter l'API.");
    } finally {
      setActivateSubmitting(false);
    }
  }

  return (
    <>
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

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {!loadError ? (
        <>
          <div>
            <DataTable
              title="Pays actifs"
              columns={columnsActive}
              data={activeCountries}
              emptyMessage="Aucun pays actif."
              search={{
                placeholder: "Rechercher dans les pays actifs...",
                ariaLabel: "Recherche pays actifs",
                name: "search-country-active",
              }}
              pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
              globalFilterFn={countryGlobalFilterFn}
              initialSorting={[{ id: "name", desc: false }]}
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
                  <DialogDescription>
                    {countryToDelete ? (
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium text-foreground flex items-center gap-0.5">
                            <CountryNameWithFlag
                              name={countryToDelete.name}
                              codeIso2={countryToDelete.codeIso2}
                              className="flex items-center gap-0.5"
                            />
                            <span>({countryToDelete.codeIso2})</span>
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
                      </div>
                    ) : null}
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
            <DataTable
              title="Pays désactivés"
              columns={columnsDeactivated}
              data={deactivatedCountries}
              emptyMessage="Aucun pays désactivé."
              search={{
                placeholder: "Rechercher dans les pays supprimes...",
                ariaLabel: "Recherche pays supprimes",
                name: "search-country-deactivated",
              }}
              pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
              globalFilterFn={countryGlobalFilterFn}
              initialSorting={[{ id: "name", desc: false }]}
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
                  <DialogDescription>
                    {countryToActivate ? (
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium text-foreground flex items-center gap-0.5">
                            <CountryNameWithFlag
                              name={countryToActivate.name}
                              codeIso2={countryToActivate.codeIso2}
                              className="flex items-center gap-0.5"
                            />
                            <span> ({countryToActivate.codeIso2}) </span>
                          </span>
                        </p>
                        <p>
                          <span>
                            Ce pays sera de nouveau disponible dans la liste des
                            pays actifs.
                          </span>
                        </p>
                      </div>
                    ) : null}
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
        </>
      ) : null}
    </>
  );
}
