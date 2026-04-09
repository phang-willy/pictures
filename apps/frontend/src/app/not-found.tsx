import type { Metadata } from "next";
import { HttpErrorView } from "@/components/http-error-view";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: `Page introuvable — ${appName}`,
};

export default function NotFound() {
  return <HttpErrorView status={404} />;
}
