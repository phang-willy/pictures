/** OpenFreeMap + OpenMapTiles, sans clé. @see https://openfreemap.org/ */
export const OPENFREEMAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

export function openfreemapStyleForTheme(
  resolvedTheme: string | undefined,
): string {
  return resolvedTheme === "dark"
    ? OPENFREEMAP_STYLES.dark
    : OPENFREEMAP_STYLES.light;
}
