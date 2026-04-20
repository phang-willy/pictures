"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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

import type { ApiDataTableSearchField } from "@/types/api-data-table.types";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ToolbarProps = {
  showSearch: boolean;
  searchField: ApiDataTableSearchField | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  searchDisabled: boolean;
  currentPageSize: number;
  selectablePageSizes: number[];
  onPageSizeChange: (next: number) => void;
  pageSizeDisabled: boolean;
};

export function ApiDataTableToolbar(_props: ToolbarProps) {
  const {
    showSearch,
    searchField,
    searchInput,
    onSearchInputChange,
    searchDisabled,
    currentPageSize,
    selectablePageSizes,
    onPageSizeChange,
    pageSizeDisabled,
  } = _props;

  return (
    <div className="flex items-center justify-between">
      {showSearch && searchField ? (
        <Input
          placeholder={searchField.placeholder}
          aria-label={searchField.ariaLabel}
          name={searchField.name}
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          className={searchField.className ?? "max-w-md"}
          disabled={searchDisabled}
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
            onPageSizeChange(next);
          }}
          disabled={pageSizeDisabled}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-18"
            aria-label="Nombre de lignes par page"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {selectablePageSizes.map((number: number) => (
              <SelectItem key={number} value={String(number)}>
                {number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

type DataPanelProps<TData> = {
  table: TanstackTable<TData>;
  columns: ColumnDef<TData, unknown>[];
  wrapperClassName: string;
  emptyBodyText: string;
};

export function ApiDataTableDataPanel<TData>({
  table,
  columns,
  wrapperClassName,
  emptyBodyText,
}: DataPanelProps<TData>) {
  return (
    <div className={wrapperClassName}>
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
                {emptyBodyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

type PaginationBarProps = {
  statsSummary: string;
  statsPage: string;
  loading: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function ApiDataTablePaginationBar({
  statsSummary,
  statsPage,
  loading,
  onFirst,
  onPrev,
  onNext,
  onLast,
  canPrev,
  canNext,
}: PaginationBarProps) {
  return (
    <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{statsSummary}</span>
        <span className="hidden sm:inline" aria-hidden>
          ·
        </span>
        <span>{statsPage}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onFirst}
                disabled={!canPrev || loading}
                aria-label="Première page"
                >
                <ChevronsLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Première page</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrev}
                disabled={!canPrev || loading}
                aria-label="Page précédente"
                >
                <ChevronLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Page précédente</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!canNext || loading}
                aria-label="Page suivante"
                >
                <ChevronRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Page suivante</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLast}
                disabled={!canNext || loading}
                aria-label="Dernière page"
                >
                <ChevronsRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Dernière page</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
