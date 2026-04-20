type MaplibreMapNewProps = {
  container: HTMLElement;
  initialStyle: string;
  center: [number, number];
  zoom?: number;
};

import maplibregl from "maplibre-gl";

export function maplibreMapNew({ container, initialStyle, center, zoom }: MaplibreMapNewProps): maplibregl.Map {
  return new maplibregl.Map({
    container,
    style: initialStyle,
    center,
    zoom: zoom ?? 9,
    minZoom: 0,
    maxZoom: 20,
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
}