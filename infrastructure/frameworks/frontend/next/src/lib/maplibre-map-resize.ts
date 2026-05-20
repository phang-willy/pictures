import type { Map } from "maplibre-gl";

/**
 * Après `setStyle`, changement de layout ou thème, le canvas MapLibre peut
 * garder une mauvaise taille - double rAF + resize corrige le décalage.
 */
export function scheduleMapResize(map: Map): void {
  requestAnimationFrame(() => {
    map.resize();
    requestAnimationFrame(() => {
      map.resize();
    });
  });
}

/**
 * Après bascule thème (souvent avec transition CSS), un seul resize ne suffit pas :
 * replanifie sur plusieurs frames pour que le canvas reste dans son bloc.
 */
export function scheduleMapResizeRobust(map: Map): void {
  scheduleMapResize(map);
  window.setTimeout(() => scheduleMapResize(map), 50);
  window.setTimeout(() => scheduleMapResize(map), 200);
  window.setTimeout(() => scheduleMapResize(map), 500);
  window.setTimeout(() => scheduleMapResize(map), 950);
}
