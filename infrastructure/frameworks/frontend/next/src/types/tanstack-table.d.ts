import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<_TData extends RowData, _TValue> {
    /** Stable string for DOM attributes (e.g. data-cell) when header is a component */
    dataCellLabel?: string;
  }
}
