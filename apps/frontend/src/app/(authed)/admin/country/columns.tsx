"use client";

import Link from "next/link";
import type { ColumnDef, FilterFn, HeaderContext } from "@tanstack/react-table";
import {
  ArrowUpDown,
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  RotateCcw,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CountryNameWithFlag } from "@/components/admin/country-name-with-flag";
import type { CountryRow } from "@shared/schemas";

export type { CountryRow };

export function filterCountriesBySearch(
  rows: CountryRow[],
  query: string,
): CountryRow[] {
  const search = query.trim().toLowerCase();
  if (!search) {
    return rows;
  }

  return rows.filter((country) => {
    const values = [
      country.id,
      country.continent?.name ?? "",
      country.name,
      country.codeIso2,
      country.codeIso3 ?? "",
      formatDate(country.createdAt, { mode: "date-hour" }),
      formatDate(country.updatedAt, { mode: "date-hour" }),
      country.deletedAt
        ? formatDate(country.deletedAt, { mode: "date-hour" })
        : "",
    ];
    return values.some((value) => value.toLowerCase().includes(search));
  });
}

export const countryGlobalFilterFn: FilterFn<CountryRow> = (
  row,
  _columnId,
  filterValue,
) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) {
    return true;
  }
  return filterCountriesBySearch([row.original], q).length > 0;
};

function sortHeader(label: string) {
  function CountryColumnSortHeader({
    column,
  }: HeaderContext<CountryRow, unknown>) {
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
  CountryColumnSortHeader.displayName = `CountryColumnSortHeader(${label})`;
  return CountryColumnSortHeader;
}

const countryDataColumns: ColumnDef<CountryRow>[] = [
  {
    accessorKey: "id",
    header: sortHeader("ID"),
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
    id: "continent",
    accessorFn: (row) => row.continent?.name ?? "",
    header: sortHeader("Continent"),
    cell: ({ row }) => row.original.continent?.name ?? "-",
  },
  {
    accessorKey: "name",
    header: sortHeader("Nom"),
    cell: ({ row }) => (
      <CountryNameWithFlag
        name={row.original.name}
        codeIso2={row.original.codeIso2}
      />
    ),
  },
  {
    accessorKey: "codeIso2",
    header: sortHeader("Code ISO 2"),
  },
  {
    accessorKey: "codeIso3",
    header: sortHeader("Code ISO 3"),
    cell: ({ row }) => row.original.codeIso3 ?? "-",
  },
  {
    accessorKey: "createdAt",
    header: sortHeader("Date de création"),
    cell: ({ row }) =>
      formatDate(row.original.createdAt, { mode: "date-hour" }),
  },
  {
    accessorKey: "updatedAt",
    header: sortHeader("Date de modification"),
    cell: ({ row }) =>
      formatDate(row.original.updatedAt, { mode: "date-hour" }),
  },
];

export function createActiveCountryColumns(handlers: {
  onRequestDelete: (country: CountryRow) => void;
}): ColumnDef<CountryRow>[] {
  return [
    ...countryDataColumns,
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const country = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8"
                aria-label="Actions pour ce pays"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/country/view/${country.id}`}>
                  <span className="flex items-center gap-2">
                    <EyeIcon className="size-4" />
                    <span>Voir</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/country/edit/${country.id}`}>
                  <span className="flex items-center gap-2">
                    <PencilIcon className="size-4" />
                    <span>Modifier</span>
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => handlers.onRequestDelete(country)}
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

export function createDeactivatedCountryColumns(handlers: {
  onRequestReactivate: (country: CountryRow) => void;
}): ColumnDef<CountryRow>[] {
  return [
    ...countryDataColumns,
    {
      accessorKey: "deletedAt",
      header: sortHeader("Date de désactivation"),
      cell: ({ row }) =>
        formatDate(row.original.deletedAt, { mode: "date-hour" }),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const country = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8"
                aria-label="Actions pour ce pays desactive"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => handlers.onRequestReactivate(country)}
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-4" />
                  <span>Réactiver</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
