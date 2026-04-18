"use client";

import * as React from "react";
import {
  type ColumnDef,
  type Table as TanstackTable,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ApiPagination } from "@pictures/contracts";

import {
  DATA_TABLE_DEFAULT_PAGE_SIZE,
  DATA_TABLE_PAGE_SIZE_OPTIONS,
} from "@/components/ui/data-table";
import type {
  ApiDataTableProps,
  ApiDataTableSearchField,
} from "@/types/api-data-table.types";

export type UseApiDataTableParams<TData> = Pick<
  ApiDataTableProps<TData>,
  | "columns"
  | "loadPage"
  | "search"
  | "pageSize"
  | "pageSizeOptions"
  | "refreshSignal"
>;

export type UseApiDataTableResult<TData> = {
  table: TanstackTable<TData>;
  columns: ColumnDef<TData, unknown>[];
  loading: boolean;
  loadError: string | null;
  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  showSearch: boolean;
  searchField: ApiDataTableSearchField | null;
  currentPageSize: number;
  selectablePageSizes: number[];
  onPageSizeChange: (next: number) => void;
  statsSummary: string;
  statsPage: string;
  tableWrapperClassName: string;
  emptyBodyText: string;
  pageCountForNav: number;
};

export function useApiDataTable<TData>(
  params: UseApiDataTableParams<TData> & {
    emptyMessage: string;
  },
): UseApiDataTableResult<TData> {
  const {
    columns,
    loadPage,
    search,
    emptyMessage,
    pageSize = DATA_TABLE_DEFAULT_PAGE_SIZE,
    pageSizeOptions = DATA_TABLE_PAGE_SIZE_OPTIONS,
    refreshSignal = 0,
  } = params;

  const [rows, setRows] = React.useState<TData[]>([]);
  const [meta, setMeta] = React.useState<ApiPagination | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });

  const loadPageRef = React.useRef(loadPage);
  loadPageRef.current = loadPage;

  const lastSuccessfulSearchRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize }));
  }, [pageSize]);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const searchChanged =
        lastSuccessfulSearchRef.current !== debouncedQuery;
      const pageToFetch = searchChanged ? 1 : pagination.pageIndex + 1;

      setLoading(true);
      setLoadError(null);
      const result = await loadPageRef.current({
        page: pageToFetch,
        pageSize: pagination.pageSize,
        query: debouncedQuery,
      });
      if (cancelled) {
        return;
      }
      setLoading(false);
      if ("error" in result) {
        setLoadError(result.error);
        setRows([]);
        setMeta(null);
        return;
      }
      lastSuccessfulSearchRef.current = debouncedQuery;
      setLoadError(null);
      setRows(result.rows);
      setMeta(result.pagination);
      setPagination({
        pageIndex: result.pagination.current_page - 1,
        pageSize: result.pagination.per_page,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedQuery,
    refreshSignal,
  ]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table useReactTable
  const table = useReactTable({
    data: rows,
    columns,
    pageCount: meta ? Math.max(1, meta.total_pages) : 1,
    rowCount: meta?.total,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
    manualPagination: true,
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next =
          typeof updater === "function"
            ? updater({
                pageIndex: prev.pageIndex,
                pageSize: prev.pageSize,
              })
            : updater;
        return {
          pageIndex: next.pageIndex,
          pageSize: next.pageSize,
        };
      });
    },
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  const total = meta?.total ?? 0;
  const pageCount = Math.max(1, meta?.total_pages ?? 1);
  const { pageIndex, pageSize: currentPageSize } = pagination;
  const fromRow =
    total === 0 || rows.length === 0
      ? 0
      : pageIndex * currentPageSize + 1;
  const toRow =
    total === 0 || rows.length === 0
      ? 0
      : pageIndex * currentPageSize + rows.length;

  const selectablePageSizes = React.useMemo(() => {
    const merged = new Set<number>([...pageSizeOptions, currentPageSize]);
    return Array.from(merged)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
  }, [pageSizeOptions, currentPageSize]);

  const showSearch = search !== false && search !== undefined;
  const searchField = showSearch ? search : null;

  const hasStats = !loading && meta !== null;
  const statsSummary = hasStats
    ? total === 0
      ? "0 résultat"
      : `Affichage ${fromRow}–${toRow} sur ${total}`
    : "…";
  const statsPage = hasStats ? `Page ${pageIndex + 1} / ${pageCount}` : "…";

  const onPageSizeChange = React.useCallback(
    (next: number) => {
      if (!Number.isFinite(next)) {
        return;
      }
      table.setPageSize(next);
      table.setPageIndex(0);
    },
    [table],
  );

  const emptyBodyText = loading ? "Chargement…" : emptyMessage;
  const tableWrapperClassName = loading
    ? "w-full opacity-60 pointer-events-none"
    : "w-full";

  return {
    table,
    columns,
    loading,
    loadError,
    searchInput,
    setSearchInput,
    showSearch,
    searchField,
    currentPageSize,
    selectablePageSizes,
    onPageSizeChange,
    statsSummary,
    statsPage,
    tableWrapperClassName,
    emptyBodyText,
    pageCountForNav: pageCount,
  };
}
