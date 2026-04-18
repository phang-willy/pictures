import type L from "leaflet";

/**
 * Libellés français pour Leaflet.draw (barre polygone / édition / suppression).
 * À appeler après l’import de `leaflet-draw`, avant `L.Control.Draw`.
 */
export function applyLeafletDrawFrenchLabels(Lref: typeof L): void {
  const d = Lref.drawLocal;
  if (Lref.Control && Lref.Control.Zoom) {
    Lref.Control.Zoom.prototype.options.zoomInTitle = "Zoom avant";
    Lref.Control.Zoom.prototype.options.zoomOutTitle = "Zoom arrière";
  }
  d.draw.toolbar.actions.title = "Annuler le dessin";
  d.draw.toolbar.actions.text = "Annuler";
  d.draw.toolbar.finish.title = "Terminer le tracé";
  d.draw.toolbar.finish.text = "Terminer";
  d.draw.toolbar.undo.title = "Supprimer le dernier point";
  d.draw.toolbar.undo.text = "Supprimer le dernier point";
  d.draw.toolbar.buttons.polygon = "Dessiner un polygone";
  d.draw.handlers.polygon.tooltip.start = "Cliquez pour commencer le polygone.";
  d.draw.handlers.polygon.tooltip.cont = "Cliquez pour continuer le tracé.";
  d.draw.handlers.polygon.tooltip.end =
    "Cliquez sur le premier point pour fermer la forme.";
  d.draw.handlers.polyline.error =
    "<strong>Erreur :</strong> les arêtes du tracé ne doivent pas se croiser.";
  d.edit.toolbar.actions.save.title = "Enregistrer les modifications";
  d.edit.toolbar.actions.save.text = "Enregistrer";
  d.edit.toolbar.actions.cancel.title = "Annuler (toutes les modifications)";
  d.edit.toolbar.actions.cancel.text = "Annuler";
  d.edit.toolbar.actions.clearAll.title = "Tout supprimer";
  d.edit.toolbar.actions.clearAll.text = "Tout effacer";
  d.edit.toolbar.buttons.edit = "Modifier les tracés";
  d.edit.toolbar.buttons.editDisabled = "Aucun tracé à modifier";
  d.edit.toolbar.buttons.remove = "Supprimer des tracés";
  d.edit.toolbar.buttons.removeDisabled = "Aucun tracé à supprimer";
  d.edit.handlers.edit.tooltip.text =
    "Faites glisser les sommets ou les marqueurs pour modifier.";
  d.edit.handlers.edit.tooltip.subtext =
    "Cliquez sur Annuler pour revenir en arrière.";
  d.edit.handlers.remove.tooltip.text =
    "Cliquez sur une forme pour la supprimer.";
}
