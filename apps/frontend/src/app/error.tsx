"use client";

import { useEffect } from "react";
import { HttpErrorView } from "@/components/http-error-view";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AppError = Error & { status?: number; statusCode?: number };

function readStatus(error: AppError): number {
  if (typeof error.status === "number" && error.status >= 100 && error.status <= 599) {
    return error.status;
  }
  if (typeof error.statusCode === "number" && error.statusCode >= 100 && error.statusCode <= 599) {
    return error.statusCode;
  }
  return 500;
}

export default function ErrorBoundaryPage({
  error,
}: {
  error: AppError;
}) {
  const status = readStatus(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <HttpErrorView status={status} message={error.message || undefined} />
      <div className="flex gap-2 items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
