"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl } from "@/lib/api";
import { stashAuthFeedbackForNextPage } from "@/lib/auth-feedback-handoff";
import { FloatingAuthAlert } from "@/components/floating-auth-alert";
import { useAuthFeedback } from "@/hooks/use-auth-feedback";

type FormSubmitEvent = Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0];

export function ConfirmPageClient() {
  const router = useRouter();
  const { feedback, notify, dismiss } = useAuthFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  const isAccountConfirm = searchParams.get("type") === "account";
  const cardTitle = isAccountConfirm ? "Confirmation du compte" : "Confirmation";

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();

    const type = searchParams.get("type");
    const token = searchParams.get("token");
    if (!type || !token) {
      notify("destructive", "Lien de confirmation invalide.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(apiUrl("/api/auth/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, token }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok) {
        notify("destructive", payload.message ?? "Impossible de confirmer ton compte.");
        return;
      }

      if (payload.success === false) {
        notify("destructive", payload.message ?? "Lien de confirmation invalide ou déjà utilisé.");
        return;
      }

      stashAuthFeedbackForNextPage({
        variant: "success",
        message: "Compte confirmé avec succès.",
      });
      router.push("/login");
    } catch {
      notify("destructive", "Erreur réseau, réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FloatingAuthAlert feedback={feedback} placement="top" onDismiss={dismiss} />
      <section className="w-full container mx-auto p-4 xl:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{cardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Confirmation..." : "Confirmer"}
                </Button>
              </form>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
