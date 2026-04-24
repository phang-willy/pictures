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
  PostRow,
  createActivePostColumns,
  createDeactivatedPostColumns,
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

export function PostAdmin() {
  const [listsVersion, setListsVersion] = useState(0);
  const [postToDesactivate, setPostToDesactivate] = useState<PostRow | null>(
    null,
  );
  const [deactivateSubmitting, setDesactivateSubmitting] = useState(false);
  const [deactivateError, setDesactivateError] = useState<string | null>(null);
  const [postToActivate, setPostToActivate] = useState<PostRow | null>(null);
  const [activateSubmitting, setActivateSubmitting] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columnsActive = useMemo(
    () =>
      createActivePostColumns(
        { onRequestDesactivate: (post) => setPostToDesactivate(post) },
        { sortableHeaders: true },
      ),
    [],
  );

  const columnsDeactivated = useMemo(
    () =>
      createDeactivatedPostColumns(
        {
          onRequestActivate: (post) => setPostToActivate(post),
          onRequestDelete: (post) => setPostToDelete(post),
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
      rows: payload.items as PostRow[],
      pagination: payload.pagination,
    };
  };

  const loadActivePage = useCallback(async (args: LoadPageArgs) => {
    const params = new URLSearchParams({
      page: String(args.page),
      per_page: String(args.pageSize),
    });
    const res = await apiFetch(`/api/post?${params.toString()}`);
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
    const res = await apiFetch(`/api/post?${params.toString()}`);
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
    if (!postToDesactivate) {
      return;
    }
    setDesactivateSubmitting(true);
    setDesactivateError(null);
    try {
      const res = await apiFetch(
        `/api/post/${encodeURIComponent(postToDesactivate.id)}`,
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
      setPostToDesactivate(null);
      bumpLists();
    } catch {
      setDesactivateError("Impossible de contacter l'API.");
    } finally {
      setDesactivateSubmitting(false);
    }
  }

  async function confirmActivate() {
    if (!postToActivate) {
      return;
    }
    setActivateSubmitting(true);
    setActivateError(null);
    try {
      const res = await apiFetch(
        `/api/post/${encodeURIComponent(postToActivate.id)}`,
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
      setPostToActivate(null);
      bumpLists();
    } catch {
      setActivateError("Impossible de contacter l'API.");
    } finally {
      setActivateSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!postToDelete) {
      return;
    }
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(
        `/api/post/${encodeURIComponent(postToDelete.id)}`,
        {
          method: "DELETE",
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
      setPostToDelete(null);
      bumpLists();
    } catch {
      setDeleteError("Impossible de contacter l'API.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Liste des posts</h1>
        <Button asChild>
          <Link href="/admin/post/new">
            <span className="flex items-center gap-2">
              <PlusIcon className="size-4" />
              <span>Ajouter</span>
            </span>
          </Link>
        </Button>
      </div>

      <ApiDataTable
        title="Posts actifs"
        columns={columnsActive}
        emptyMessage="Aucun post actif."
        search={{
          placeholder: "Rechercher dans les posts actifs...",
          ariaLabel: "Recherche posts actifs",
          name: "search-post-active",
        }}
        loadPage={loadActivePage}
        pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
        refreshSignal={listsVersion}
      />

      <ApiDataTable
        title="Posts désactivés"
        columns={columnsDeactivated}
        emptyMessage="Aucun post désactivé."
        search={{
          placeholder: "Rechercher dans les posts désactivés...",
          ariaLabel: "Recherche posts désactivés",
          name: "search-post-inactive",
        }}
        loadPage={loadDeactivatedPage}
        pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
        refreshSignal={listsVersion}
      />

      <Dialog
        open={postToDesactivate !== null}
        onOpenChange={(open) => !open && setPostToDesactivate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Désactiver ce post ?</DialogTitle>
            <DialogDescription>
              {postToDesactivate
                ? `Le post « ${postToDesactivate.name} » sera marqué comme désactivé.`
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
        open={postToActivate !== null}
        onOpenChange={(open) => !open && setPostToActivate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réactiver ce post ?</DialogTitle>
            <DialogDescription>
              {postToActivate
                ? `Le post « ${postToActivate.name} » redeviendra actif.`
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
        open={postToDelete !== null}
        onOpenChange={(open) => !open && setPostToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer définitivement ce post ?</DialogTitle>
            <DialogDescription>
              {postToDelete
                ? `Action irréversible pour « ${postToDelete.name} ». Impossible s’il reste des photos liées à ce post.`
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
    </div>
  );
}
