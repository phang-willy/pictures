"use client";

import Link from "next/link";
import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import {
  ArrowUpDown,
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  RotateCcw,
  OctagonMinus,
  TrashIcon,
} from "lucide-react";
import { formatDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CountryFlag } from "@/components/country-flag";
import type { PostHttpDetail } from "@/types/post.types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PostRow = PostHttpDetail;

function sortHeader(label: string) {
  function PostColumnSortHeader({ column }: HeaderContext<PostRow, unknown>) {
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
  PostColumnSortHeader.displayName = `PostColumnSortHeader(${label})`;
  return PostColumnSortHeader;
}

function postLabeledHeader(sortableHeaders: boolean, label: string) {
  return {
    header: sortableHeaders ? sortHeader(label) : label,
    meta: { dataCellLabel: label },
  };
}

function buildPostDataColumns(sortableHeaders: boolean): ColumnDef<PostRow>[] {
  const labeledHeader = (label: string) =>
    postLabeledHeader(sortableHeaders, label);

  return [
    {
      accessorKey: "id",
      ...labeledHeader("ID"),
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{id.slice(0, 10)}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{id}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "city",
      ...labeledHeader("Ville"),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2">
          <CountryFlag
            name={row.original.city.country.name}
            iso2={row.original.city.country.iso2}
            show_name={false}
          />
          <span className="text-muted-foreground">
            ({row.original.city.country.iso2})
          </span>
          <span>{row.original.city.name}</span>
        </span>
      ),
    },
    {
      accessorKey: "name",
      ...labeledHeader("Post"),
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: "slug",
      ...labeledHeader("Slug"),
      cell: ({ row }) => row.original.slug,
    },
    {
      accessorKey: "createdAt",
      ...labeledHeader("Créé le"),
      cell: ({ row }) =>
        formatDate(row.original.createdAt, { mode: "date-hour" }),
    },
    {
      accessorKey: "updatedAt",
      ...labeledHeader("Modifié le"),
      cell: ({ row }) =>
        formatDate(row.original.updatedAt, { mode: "date-hour" }),
    },
  ];
}

export function createActivePostColumns(
  handlers: { onRequestDesactivate: (post: PostRow) => void },
  options?: { sortableHeaders?: boolean },
): ColumnDef<PostRow>[] {
  const sortableHeaders = options?.sortableHeaders ?? true;
  return [
    ...buildPostDataColumns(sortableHeaders),
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const post = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/post/view/${post.id}`}>
                  <span className="flex items-center gap-2">
                    <EyeIcon className="size-4" />
                    <span>Voir</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/post/edit/${post.id}`}>
                  <span className="flex items-center gap-2">
                    <PencilIcon className="size-4" />
                    <span>Modifier</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => handlers.onRequestDesactivate(post)}
              >
                <span className="flex items-center gap-2">
                  <OctagonMinus className="size-4" />
                  <span>Désactiver</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

export function createDeactivatedPostColumns(
  handlers: {
    onRequestActivate: (post: PostRow) => void;
    onRequestDelete: (post: PostRow) => void;
  },
  options?: { sortableHeaders?: boolean },
): ColumnDef<PostRow>[] {
  const sortableHeaders = options?.sortableHeaders ?? true;
  return [
    ...buildPostDataColumns(sortableHeaders),
    {
      accessorKey: "deactivatedAt",
      ...postLabeledHeader(sortableHeaders, "Désactivé le"),
      cell: ({ row }) =>
        formatDate(row.original.deactivatedAt, { mode: "date-hour" }),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const post = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => handlers.onRequestActivate(post)}
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-4" />
                  <span>Réactiver</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => void handlers.onRequestDelete(post)}
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
