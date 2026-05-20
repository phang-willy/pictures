import { HttpErrorView } from "@/components/http-error-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ville introuvable",
};

export default function CitySlugNotFound() {
  return (
    <HttpErrorView
      status={404}
      title="Ville introuvable"
      message={
        "Cette adresse ne correspond pas à une ville publiée. Utilisez la page « Villes » pour ouvrir un lien valide."
      }
    />
  );
}
