"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export const DATA_TABLE_DEFAULT_PAGE_SIZE = 20;

/** Tailles de page proposées dans le sélecteur. */
export const DATA_TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  title?: React.ReactNode;
  emptyMessage: string;
  search?:
    | {
        placeholder: string;
        ariaLabel: string;
        name: string;
        className?: string;
      }
    | false;
  pageSize?: number;
  /** Options du sélecteur « lignes par page » (défaut : DATA_TABLE_PAGE_SIZE_OPTIONS). */
  pageSizeOptions?: readonly number[];
  /** Filtre global (recherche). Par défaut : sous-chaîne sur `JSON.stringify` de la ligne. */
  globalFilterFn?: FilterFn<TData>;
  initialSorting?: SortingState;
};

export function DataTable<TData>({
  columns,
  data,
  title,
  emptyMessage,
  search,
  pageSize = DATA_TABLE_DEFAULT_PAGE_SIZE,
  pageSizeOptions = DATA_TABLE_PAGE_SIZE_OPTIONS,
  globalFilterFn,
  initialSorting = [],
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize }));
  }, [pageSize]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter]);

  const defaultGlobalFilter = React.useMemo<FilterFn<TData>>(
    () => (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (!q) {
        return true;
      }
      try {
        return JSON.stringify(row.original).toLowerCase().includes(q);
      } catch {
        return true;
      }
    },
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table useReactTable
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn ?? defaultGlobalFilter,
  });

  const filteredRows = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const fromRow = filteredRows === 0 ? 0 : pageIndex * currentPageSize + 1;
  const toRow = Math.min((pageIndex + 1) * currentPageSize, filteredRows);

  const selectablePageSizes = React.useMemo(() => {
    const merged = new Set<number>([...pageSizeOptions, currentPageSize]);
    return Array.from(merged)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
  }, [pageSizeOptions, currentPageSize]);

  const showSearch = search !== false && search !== undefined;
  const searchProps = showSearch ? search : null;

  return (
    <div className="space-y-3">
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      <div className="flex items-center justify-between">
        {showSearch && searchProps ? (
          <Input
            placeholder={searchProps.placeholder}
            aria-label={searchProps.ariaLabel}
            name={searchProps.name}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className={searchProps.className ?? "max-w-md"}
          />
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Lignes
          </span>
          <Select
            value={String(currentPageSize)}
            onValueChange={(value) => {
              const next = Number.parseInt(value, 10);
              if (!Number.isFinite(next)) {
                return;
              }
              table.setPageSize(next);
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-18"
              aria-label="Nombre de lignes par page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {selectablePageSizes.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="odd:bg-muted/50 hover:bg-muted/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            {filteredRows === 0
              ? "0 résultat"
              : `Affichage ${fromRow}-${toRow} sur ${filteredRows}`}
          </span>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span>
            Page {pageIndex + 1} / {pageCount}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Première page"
            >
              <ChevronsLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Page précédente"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Page suivante"
            >
              <ChevronRight />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Dernière page"
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
