import { HttpErrorView } from "@/components/http-error-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post introuvable",
};

export default function PostSlugNotFound() {
  return (
    <HttpErrorView
      status={404}
      title="Publication introuvable"
      message={
        "Cette adresse ne correspond pas à une publication publiée. Utilisez la page « Publications » pour ouvrir un lien valide."
      }
    />
  );
}
