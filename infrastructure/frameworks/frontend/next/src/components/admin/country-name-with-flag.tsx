import * as FlagSvgStrings from "country-flag-icons/string/3x2";

type CountryNameWithFlagProps = {
  name: string;
  iso2: string;
  className?: string;
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

export function CountryNameWithFlag({
  name,
  iso2,
  className,
}: CountryNameWithFlagProps) {
  const codeUpper = iso2.trim().toUpperCase();
  const svgMarkup = resolveFlagSvg(iso2);
  return (
    <span className={className ?? "inline-flex items-center gap-2"}>
      {svgMarkup ? (
        <span
          className={flagHostClassName}
          title={codeUpper}
          aria-hidden
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : null}
      <span>{name}</span>
    </span>
  );
}
