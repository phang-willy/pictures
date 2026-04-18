"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function defaultTitle(status: number): string {
  if (status === 404) return "Page introuvable";
  if (status >= 500) return "Erreur serveur";
  if (status >= 400) return "Requete impossible";
  if (status >= 300 && status < 400) return "Redirection";
  return "Erreur";
}

function defaultMessage(status: number): string {
  if (status === 404) {
    return "La page demandée n'existe pas.";
  }
  if (status >= 500) {
    return "Une erreur technique est survenue. Veuillez réessayer.";
  }
  if (status >= 400) {
    return "La requête n'a pas pu être traitée.";
  }
  if (status >= 300 && status < 400) {
    return "Vous avez été redirigé. Si ce n'est pas attendu, retournez à l'accueil.";
  }
  return "Une erreur inattendue est survenue.";
}

export type HttpErrorViewProps = {
  status: number;
  title?: string;
  message?: string;
};

export function HttpErrorView({ status, title, message }: HttpErrorViewProps) {
  const resolvedTitle = title ?? defaultTitle(status);
  const resolvedMessage = message ?? defaultMessage(status);

  return (
    <main className="flex min-h-[70vh] w-full flex-1 items-center justify-center p-4 xl:p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-muted-foreground font-mono text-7xl font-bold tabular-nums">
            {status}
          </p>
          <CardTitle className="text-2xl">{resolvedTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {resolvedMessage}
          </p>
        </CardContent>
        <CardFooter className="flex gap-2 items-center justify-between">
          <Button asChild variant="default">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              }
            }}
          >
            Page précédente
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
