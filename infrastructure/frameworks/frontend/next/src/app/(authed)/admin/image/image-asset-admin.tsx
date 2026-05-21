"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CopyIcon,
  ExternalLinkIcon,
  FileImageIcon,
  ImagePlusIcon,
  LoaderCircle,
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiDataTable, type LoadPageArgs } from "@/components/data-table";
import { DATA_TABLE_DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import type { ImageAssetHttpItem } from "@/types/image-asset.types";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type ImageAssetRow = ImageAssetHttpItem;

type ApiPagination = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
};

type PaginatedResponse = {
  items?: unknown;
  pagination?: unknown;
};

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

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }
  const units = ["o", "Ko", "Mo", "Go"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function assetUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function absoluteAssetUrl(path: string): string {
  const relativeUrl = assetUrl(path);
  if (typeof window === "undefined") {
    return relativeUrl;
  }
  return new URL(relativeUrl, window.location.origin).toString();
}

function sortHeader(label: string) {
  function ImageAssetColumnSortHeader({
    column,
  }: HeaderContext<ImageAssetRow, unknown>) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    );
  }
  ImageAssetColumnSortHeader.displayName = `ImageAssetColumnSortHeader(${label})`;
  return ImageAssetColumnSortHeader;
}

function imageAssetColumns(handlers: {
  onRequestEdit: (image: ImageAssetRow) => void;
  onRequestDelete: (image: ImageAssetRow) => void;
}): ColumnDef<ImageAssetRow>[] {
  return [
    {
      id: "preview",
      header: "Aperçu",
      enableSorting: false,
      cell: ({ row }) => (
        <a
          href={assetUrl(row.original.webpUrl)}
          target="_blank"
          rel="noreferrer"
          className="block size-14 overflow-hidden rounded-md border bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(row.original.webpUrl)}
            alt={row.original.title}
            className="size-full object-cover"
            loading="lazy"
            title={row.original.title}
          />
        </a>
      ),
    },
    {
      id: "title",
      accessorKey: "title",
      header: sortHeader("Titre"),
      meta: { dataCellLabel: "Titre" },
      cell: ({ row }) => row.original.title,
    },
    {
      id: "fileName",
      accessorKey: "webpFileName",
      header: sortHeader("Fichier"),
      meta: { dataCellLabel: "Fichier" },
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{row.original.webpFileName.slice(37)}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{row.original.webpFileName}</p>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: "dimensions",
      accessorKey: "dimensions",
      header: sortHeader("Dimensions"),
      meta: { dataCellLabel: "Dimensions" },
      cell: ({ row }) => `${row.original.width} x ${row.original.height}`,
    },
    {
      id: "webpSizeBytes",
      accessorKey: "webpSizeBytes",
      header: sortHeader("Poids"),
      meta: { dataCellLabel: "Poids" },
      cell: ({ row }) => formatBytes(row.original.webpSizeBytes),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: sortHeader("Créé le"),
      meta: { dataCellLabel: "Créé le" },
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: sortHeader("Modifié le"),
      meta: { dataCellLabel: "Modifié le" },
      cell: ({ row }) => formatDate(row.original.updatedAt),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const image = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard.writeText(
                    absoluteAssetUrl(image.webpUrl),
                  );
                  toast.success("URL copiée.");
                }}
              >
                <span className="flex items-center gap-2">
                  <CopyIcon className="size-4" />
                  <span>{"Copier l'URL"}</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={assetUrl(image.webpUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLinkIcon className="size-4" />
                    <span>Ouvrir</span>
                  </span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlers.onRequestEdit(image)}>
                <span className="flex items-center gap-2">
                  <PencilIcon className="size-4" />
                  <span>Renommer</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => handlers.onRequestDelete(image)}
              >
                <span className="flex items-center gap-2">
                  <TrashIcon className="size-4" />
                  <span>Supprimer</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export function ImageAssetAdmin() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [listsVersion, setListsVersion] = useState(0);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<ImageAssetRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<ImageAssetRow | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      imageAssetColumns({
        onRequestEdit: (image) => {
          setImageToEdit(image);
          setEditTitle(image.title);
          setEditError(null);
        },
        onRequestDelete: (image) => {
          setImageToDelete(image);
          setDeleteError(null);
        },
      }),
    [],
  );

  const bumpLists = useCallback(() => setListsVersion((v) => v + 1), []);

  const parsePageResponse = (json: unknown) => {
    const payload = (json ?? {}) as PaginatedResponse;
    if (!Array.isArray(payload.items) || !isApiPagination(payload.pagination)) {
      return null;
    }
    return {
      rows: payload.items as ImageAssetRow[],
      pagination: payload.pagination,
    };
  };

  const loadPage = useCallback(async (args: LoadPageArgs) => {
    const params = new URLSearchParams({
      page: String(args.page),
      per_page: String(args.pageSize),
    });
    if (args.query) {
      params.set("q", args.query);
    }
    const res = await apiFetch(`/api/image-assets?${params.toString()}`);
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

  const clearSelectedFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const selectUploadFile = useCallback(
    (nextFile: File | null | undefined) => {
      if (!nextFile) {
        clearSelectedFile();
        return;
      }
      if (!nextFile.type.startsWith("image/")) {
        setUploadError("Le fichier doit être une image.");
        clearSelectedFile();
        return;
      }
      setFile(nextFile);
      setUploadError(null);
    },
    [clearSelectedFile],
  );

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectUploadFile(event.dataTransfer.files?.[0]);
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function onChooseFileKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    fileInputRef.current?.click();
  }

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle || !file) {
      setUploadError("Titre et fichier image sont obligatoires.");
      return;
    }

    const formData = new FormData();
    formData.set("title", trimmedTitle);
    formData.set("file", file);

    setUploading(true);
    try {
      const res = await apiFetch("/api/image-assets", {
        method: "POST",
        body: formData,
      });
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setUploadError(parseApiErrorMessage(json, res.status));
        return;
      }
      setTitle("");
      clearSelectedFile();
      toast.success("Image convertie en WebP.");
      bumpLists();
    } catch {
      setUploadError("Impossible de contacter l'API.");
    } finally {
      setUploading(false);
    }
  }

  async function confirmEdit() {
    if (!imageToEdit) {
      return;
    }
    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      setEditError("Le titre est obligatoire.");
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      const res = await apiFetch(
        `/api/image-assets/${encodeURIComponent(imageToEdit.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle }),
        },
      );
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setEditError(parseApiErrorMessage(json, res.status));
        return;
      }
      setImageToEdit(null);
      toast.success("Image renommée.");
      bumpLists();
    } catch {
      setEditError("Impossible de contacter l'API.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!imageToDelete) {
      return;
    }
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(
        `/api/image-assets/${encodeURIComponent(imageToDelete.id)}`,
        { method: "DELETE" },
      );
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setDeleteError(parseApiErrorMessage(json, res.status));
        return;
      }
      setImageToDelete(null);
      toast.success("Image supprimée.");
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
        <h1 className="text-2xl font-semibold">Images</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ajouter une image</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpload} className="grid gap-5">
            <div className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="image-title">Titre</FieldLabel>
                <Input
                  id="image-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Exemple : Tour Eiffel coucher de soleil"
                  disabled={uploading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="image-file">Image</FieldLabel>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Glisser-déposer une image ou choisir un fichier"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={onChooseFileKeyDown}
                  onDragOver={onDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    "flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-5 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isDragging
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/30 hover:bg-muted/60",
                    uploading && "pointer-events-none opacity-60",
                  )}
                >
                  <Input
                    ref={fileInputRef}
                    id="image-file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      selectUploadFile(event.target.files?.[0])
                    }
                    disabled={uploading}
                  />
                  <UploadCloudIcon className="mb-3 size-7" />
                  <span className="text-sm font-medium">
                    Glisser-déposer une image
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    ou choisir un fichier
                  </span>
                </div>
                {file ? (
                  <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm">
                    <FileImageIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 shrink-0"
                      onClick={clearSelectedFile}
                      disabled={uploading}
                      aria-label="Retirer le fichier"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </Field>
            </div>
            {uploadError ? (
              <p className="text-sm text-destructive" role="alert">
                {uploadError}
              </p>
            ) : null}
            <div className="w-full">
              <Button type="submit" disabled={uploading}>
                <ImagePlusIcon className="size-4" />
                <div>
                  {uploading ? (
                    <div className="flex min-h-screen w-full items-center justify-center text-muted-foreground">
                      <span>Upload en cours</span>
                      <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    "Uploader"
                  )}
                </div>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiDataTable
        title="Médiathèque"
        columns={columns}
        emptyMessage="Aucune image uploadée."
        search={{
          placeholder: "Rechercher dans les images...",
          ariaLabel: "Recherche images",
          name: "search-image-assets",
        }}
        loadPage={loadPage}
        pageSize={DATA_TABLE_DEFAULT_PAGE_SIZE}
        refreshSignal={listsVersion}
      />

      <Dialog
        open={imageToEdit !== null}
        onOpenChange={(open) => !open && setImageToEdit(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{"Renommer l'image"}</DialogTitle>
            <DialogDescription>
              Le fichier sera renommé avec le nouveau titre.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="edit-image-title">Titre</FieldLabel>
            <Input
              id="edit-image-title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              disabled={editSubmitting}
            />
          </Field>
          {editError ? (
            <p className="text-sm text-destructive" role="alert">
              {editError}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={editSubmitting}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={editSubmitting}
              onClick={() => void confirmEdit()}
            >
              {editSubmitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={imageToDelete !== null}
        onOpenChange={(open) => !open && setImageToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette image ?</DialogTitle>
            <DialogDescription>
              {imageToDelete
                ? `Le fichier « ${imageToDelete.webpFileName} » sera supprimé de /uploads.`
                : ""}
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
              {deleteSubmitting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
