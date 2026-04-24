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
import { ContryFlag } from "@/components/admin/country-flag";
import type { CityHttpDetail } from "@/types/admin-city.types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CityRow = CityHttpDetail;

function sortHeader(label: string) {
  function CityColumnSortHeader({ column }: HeaderContext<CityRow, unknown>) {
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
  CityColumnSortHeader.displayName = `CityColumnSortHeader(${label})`;
  return CityColumnSortHeader;
}

function cityLabeledHeader(sortableHeaders: boolean, label: string) {
  return {
    header: sortableHeaders ? sortHeader(label) : label,
    meta: { dataCellLabel: label },
  };
}

function buildCityDataColumns(sortableHeaders: boolean): ColumnDef<CityRow>[] {
  const labeledHeader = (label: string) =>
    cityLabeledHeader(sortableHeaders, label);

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
      accessorKey: "name",
      ...labeledHeader("Ville"),
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: "slug",
      ...labeledHeader("Slug"),
      cell: ({ row }) => row.original.slug,
    },
    {
      id: "country",
      ...labeledHeader("Pays"),
      cell: ({ row }) => (
        <ContryFlag
          name={row.original.country.name}
          iso2={row.original.country.iso2}
        />
      ),
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

export function createActiveCityColumns(
  handlers: { onRequestDesactivate: (city: CityRow) => void },
  options?: { sortableHeaders?: boolean },
): ColumnDef<CityRow>[] {
  const sortableHeaders = options?.sortableHeaders ?? true;
  return [
    ...buildCityDataColumns(sortableHeaders),
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const city = row.original;
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
                <Link href={`/admin/city/view/${city.id}`}>
                  <span className="flex items-center gap-2">
                    <EyeIcon className="size-4" />
                    <span>Voir</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/city/edit/${city.id}`}>
                  <span className="flex items-center gap-2">
                    <PencilIcon className="size-4" />
                    <span>Modifier</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => handlers.onRequestDesactivate(city)}
              >
                <span className="flex items-center gap-2">
                  <OctagonMinus  className="size-4" />
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

export function createDeactivatedCityColumns(
  handlers: {
    onRequestActivate: (city: CityRow) => void;
    onRequestDelete: (city: CityRow) => void;
  },
  options?: { sortableHeaders?: boolean },
): ColumnDef<CityRow>[] {
  const sortableHeaders = options?.sortableHeaders ?? true;
  return [
    ...buildCityDataColumns(sortableHeaders),
    {
      accessorKey: "deactivatedAt",
      ...cityLabeledHeader(sortableHeaders, "Désactivé le"),
      cell: ({ row }) =>
        formatDate(row.original.deactivatedAt, { mode: "date-hour" }),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const city = row.original;
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
                onSelect={() => handlers.onRequestActivate(city)}
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-4" />
                  <span>Réactiver</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => void handlers.onRequestDelete(city)}
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
