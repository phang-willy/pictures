import maplibregl from "maplibre-gl";

export type MaplibreMapNewProps = {
  container: HTMLElement;
  initialStyle: string;
  center: [number, number];
  zoom?: number;
  /** Si défini, remplace le comportement par défaut compact du contrôle d’attribution MapLibre. */
  attributionControl?: false | { compact?: boolean; customAttribution?: string };
};

function resolveAttributionControl(
  attributionControl: MaplibreMapNewProps["attributionControl"],
): false | { compact?: boolean; customAttribution?: string } {
  if (attributionControl === false) {
    return false;
  }
  return { compact: true, ...(attributionControl ?? {}) };
}

export function closeMaplibreAttributions(mapContainer: HTMLElement): void {
  for (const el of mapContainer.querySelectorAll(".maplibregl-ctrl-attrib")) {
    el.classList.add("maplibregl-compact");
    el.classList.remove(
      "maplibregl-compact-show",
      "maplibregl-ctrl-attrib-open",
    );
    el.removeAttribute("open");

    const button = el.querySelector(".maplibregl-ctrl-attrib-button");
    if (!(button instanceof HTMLElement) || button.dataset.toggleReady) {
      continue;
    }
    button.dataset.toggleReady = "true";
    button.addEventListener(
      "click",
      (event) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        const details = button.closest(".maplibregl-ctrl-attrib");
        if (!(details instanceof HTMLElement)) {
          return;
        }
        const nextOpen = !details.hasAttribute("open");
        details.toggleAttribute("open", nextOpen);
        details.classList.toggle("maplibregl-compact-show", nextOpen);
      },
      { capture: true },
    );
  }
}

export function maplibreMapNew({
  container,
  initialStyle,
  center,
  zoom,
  attributionControl,
}: MaplibreMapNewProps): maplibregl.Map {
  const map = new maplibregl.Map({
    container,
    style: initialStyle,
    center,
    zoom: zoom ?? 9,
    minZoom: 0,
    maxZoom: 20,
    attributionControl: resolveAttributionControl(attributionControl),
    locale: {
      "Map.Title": "Carte",
      "NavigationControl.ResetBearing":
        "Faites glisser pour faire pivoter la carte, cliquez pour remettre le nord",
      "NavigationControl.ZoomIn": "Zoom avant",
      "NavigationControl.ZoomOut": "Zoom arrière",
      "GlobeControl.Enable": "Activer le globe",
      "GlobeControl.Disable": "Désactiver le globe",
    },
  });
  window.requestAnimationFrame(() => closeMaplibreAttributions(container));
  map.once("idle", () => closeMaplibreAttributions(container));
  return map;
}
