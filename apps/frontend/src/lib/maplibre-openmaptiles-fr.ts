import type { Map } from "maplibre-gl";

/**
 * OpenMapTiles / styles type OpenFreeMap : les libellés utilisent souvent `name:latin` + `name:nonlatin`
 * ou un repli `name_en`. On préfixe avec `name:fr` quand la tuile le fournit (sinon repli inchangé).
 */
function patchNameKeysForFrench(expr: unknown): unknown {
  if (!Array.isArray(expr)) {
    return expr;
  }
  const head = expr[0];
  if (head === "get") {
    const key = expr[1];
    if (key === "name:latin") {
      return ["coalesce", ["get", "name:fr"], ["get", "name:latin"]];
    }
    if (key === "name_en") {
      return ["coalesce", ["get", "name:fr"], ["get", "name_en"]];
    }
    return expr;
  }
  return expr.map((part) => patchNameKeysForFrench(part));
}

/** À appeler après `style.load` (style OpenMapTiles / OpenFreeMap). */
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
