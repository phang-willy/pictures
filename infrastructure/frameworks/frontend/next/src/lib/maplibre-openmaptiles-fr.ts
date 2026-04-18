import type { Map } from "maplibre-gl";

/**
 * OpenMapTiles / OpenFreeMap : les calques utilisent souvent
 * `["coalesce", ["get","name_en"], ["get","name"]]` ou
 * `["case", ..., ["concat", ["get","name:latin"], ...], ...]`.
 * On insère `name:fr` en priorité sans boucle infinie sur `["get","name"]`.
 */
function patchNameKeysForFrench(
  expr: unknown,
  isFallbackBranch = false,
): unknown {
  if (!Array.isArray(expr)) {
    return expr;
  }
  const head = expr[0];
  if (head === "get" && typeof expr[1] === "string") {
    const key = expr[1];
    if (
      isFallbackBranch &&
      (key === "name" || key === "name_en" || key === "name:latin")
    ) {
      return expr;
    }
    if (
      !isFallbackBranch &&
      (key === "name" || key === "name_en" || key === "name:latin")
    ) {
      return [
        "coalesce",
        ["get", "name:fr"],
        patchNameKeysForFrench(["get", key], true),
      ];
    }
    return expr;
  }
  return expr.map((part) => patchNameKeysForFrench(part, false));
}

/** À appeler après chargement du style (OpenMapTiles / OpenFreeMap). */
export function applyOpenMapTilesFrenchLabels(map: Map): void {
  const style = map.getStyle();
  if (!style.layers) {
    return;
  }
  for (const layer of style.layers) {
    if (layer.type !== "symbol") {
      continue;
    }
    const raw = layer.layout?.["text-field"];
    if (!raw || typeof raw === "string") {
      continue;
    }
    try {
      const next = patchNameKeysForFrench(raw);
      map.setLayoutProperty(layer.id, "text-field", next as never);
    } catch {
      // calque sans text-field modifiable
    }
  }
}

/** Réapplique les libellés (ex. après mise à jour du style). */
export function applyOpenMapTilesFrenchLabelsWhenReady(map: Map): void {
  const run = () => {
    try {
      applyOpenMapTilesFrenchLabels(map);
    } catch {
      /* ignore */
    }
  };
  if (map.isStyleLoaded()) {
    run();
  } else {
    map.once("style.load", run);
  }
  map.once("idle", run);
}
