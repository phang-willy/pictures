"use client";

import {
  ApiDataTableDataPanel,
  ApiDataTablePaginationBar,
  ApiDataTableToolbar,
} from "./api-data-table-shell";
import { useApiDataTable } from "@/hooks/use-api-data-table";
import type {
  ApiDataTableProps,
  ApiDataTableSearchField,
  LoadPageArgs,
  LoadPageResult,
} from "@/types/api-data-table.types";

export type {
  ApiDataTableProps,
  ApiDataTableSearchField,
  LoadPageArgs,
  LoadPageResult,
};

export { useApiDataTable } from "@/hooks/use-api-data-table";
export type {
  UseApiDataTableParams,
  UseApiDataTableResult,
} from "@/hooks/use-api-data-table";

export function ApiDataTable<TData>(props: ApiDataTableProps<TData>) {
  const {
    title,
    emptyMessage,
    columns,
    loadPage,
    search,
    pageSize,
    pageSizeOptions,
    refreshSignal,
  } = props;

  const apiTable = useApiDataTable<TData>({
    columns,
    loadPage,
    search,
    pageSize,
    pageSizeOptions,
    refreshSignal,
    emptyMessage,
  });

  const {
    showSearch,
    searchField,
    searchInput,
    setSearchInput,
    loading,
    loadError,
    table,
    columns: tableColumns,
    tableWrapperClassName,
    emptyBodyText,
    currentPageSize,
    selectablePageSizes,
    onPageSizeChange,
    statsSummary,
    statsPage,
    pageCountForNav,
  } = apiTable;

  return (
    <div className="space-y-3">
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      <ApiDataTableToolbar
        showSearch={showSearch}
        searchField={searchField}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        searchDisabled={loading}
        currentPageSize={currentPageSize}
        selectablePageSizes={selectablePageSizes}
        onPageSizeChange={onPageSizeChange}
        pageSizeDisabled={loading}
      />
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}
      <ApiDataTableDataPanel
        table={table}
        columns={tableColumns}
        wrapperClassName={tableWrapperClassName}
        emptyBodyText={emptyBodyText}
      />
      <ApiDataTablePaginationBar
        statsSummary={statsSummary}
        statsPage={statsPage}
        loading={loading}
        onFirst={() => table.setPageIndex(0)}
        onPrev={() => table.previousPage()}
        onNext={() => table.nextPage()}
        onLast={() => table.setPageIndex(pageCountForNav - 1)}
        canPrev={table.getCanPreviousPage()}
        canNext={table.getCanNextPage()}
      />
    </div>
  );
}
