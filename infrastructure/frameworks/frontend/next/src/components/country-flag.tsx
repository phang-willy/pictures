import * as FlagSvgStrings from "country-flag-icons/string/3x2";
import { cn } from "@/lib/utils";

type CountryFlagProps = {
  className?: string;
  name?: string;
  iso2: string;
  show_name?: boolean;
  size?: "sm" | "base" | "md" | "lg" | "full";
};

function resolveFlagSvg(iso2: string): string | null {
  const code = iso2.trim().toUpperCase();
  if (code.length !== 2) {
    return null;
  }
  const map = FlagSvgStrings as unknown as Record<string, string | undefined>;
  const svg = map[code];
  return typeof svg === "string" ? svg : null;
}

const flagHostClassName =
  "inline-flex h-[1.15em] w-[1.725em] shrink-0 items-center justify-center overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:block";

const flagHostSvgRules =
  "inline-flex shrink-0 items-center justify-center overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:block";

function flagHostClassForSize(size: CountryFlagProps["size"]): string {
  const resolved = size ?? "base";
  if (resolved === "base") {
    return flagHostClassName;
  }
  switch (resolved) {
    case "sm":
      return cn(flagHostSvgRules, "h-[0.9em] w-[1.35em]");
    case "md":
      return cn(flagHostSvgRules, "h-[1.35em] w-[2.025em]");
    case "lg":
      return cn(flagHostSvgRules, "h-[1.75em] w-[2.625em]");
    case "full":
      return cn(flagHostSvgRules, "h-full w-full");
    default:
      return flagHostClassName;
  }
}

export function CountryFlag({
  className,
  name,
  iso2,
  show_name = true || false,
  size,
}: CountryFlagProps) {
  const codeUpper = iso2.trim().toUpperCase();
  const svgMarkup = resolveFlagSvg(iso2);

  return (
    <span className={cn("inline-flex items-center gap-2 w-full", className)}>
      {svgMarkup ? (
        <span
          className={flagHostClassForSize(size)}
          title={codeUpper}
          aria-hidden
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : (
        iso2
      )}
      {show_name && name ? <span>{name}</span> : null}
    </span>
  );
}