import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiPagination } from "@pictures/contracts";

export type LoadPageArgs = {
  page: number;
  pageSize: number;
  query: string;
};

export type LoadPageResult<TData> =
  | { rows: TData[]; pagination: ApiPagination }
  | { error: string };

export type ApiDataTableSearchField = {
  placeholder: string;
  ariaLabel: string;
  name: string;
  className?: string;
};

export type ApiDataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  title?: ReactNode;
  emptyMessage: string;
  /** Chargement serveur : page 1-based, alignée sur `GET …?page=&per_page=&q=`. */
  loadPage: (args: LoadPageArgs) => Promise<LoadPageResult<TData>>;
  search?: ApiDataTableSearchField | false;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  /** Incrémenter après une mutation pour relancer le chargement courant. */
  refreshSignal?: number;
};
