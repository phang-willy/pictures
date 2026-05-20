import { HttpErrorView } from "@/components/http-error-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pays introuvable",
};

export default function CountrySlugNotFound() {
  return (
    <HttpErrorView
      status={404}
      title="Pays introuvable"
      message={
        "Cette adresse ne correspond pas à un pays publié. Utilisez la page « Pays » pour ouvrir un lien valide."
      }
    />
  );
}
