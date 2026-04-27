import type { ReactNode } from "react";

export type DetailRowLayout = "horizontal" | "stacked";

export type DetailRowProps = {
  label: string;
  value: ReactNode;
  layout?: DetailRowLayout;
};

export function DetailRow({
  label,
  value,
  layout = "horizontal",
}: DetailRowProps) {
  if (layout === "stacked") {
    return (
      <div className="flex flex-col gap-2 border-b border-border/60 py-2 last:border-0">
        <dt className="font-medium text-muted-foreground">{label}</dt>
        <dd className="min-w-0 wrap-break-word">{value}</dd>
      </div>
    );
  }

  return (
    <div className="grid gap-1 border-b border-border/60 py-2 last:border-0 sm:grid-cols-[minmax(8rem,14rem)_1fr] sm:gap-4">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word">{value}</dd>
    </div>
  );
}
