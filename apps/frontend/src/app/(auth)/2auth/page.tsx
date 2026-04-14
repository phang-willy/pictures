"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import type { core } from "zod";
import { twoFactorFormSchema } from "@shared/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl } from "@/lib/api";
import {
  consumePendingAuthFeedback,
  stashAuthFeedbackForNextPage,
} from "@/lib/auth-feedback-handoff";
import {
  clearTwoFactorLoginToken,
  getTwoFactorLoginToken,
  setAccessToken,
} from "@/lib/auth-session";
import { useAuthFeedback } from "@/components/auth-floating-provider";

type FormSubmitEvent = Parameters<
  NonNullable<React.ComponentProps<"form">["onSubmit"]>
>[0];

const TwoAuthPage = () => {
  const router = useRouter();
  const { notify } = useAuthFeedback();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getTwoFactorLoginToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const pending = consumePendingAuthFeedback();
    if (pending) {
      notify(pending.variant, pending.message);
    }
  }, [router, notify]);

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();

    const parsed = twoFactorFormSchema.safeParse({ code });
    if (!parsed.success) {
      const codeError = parsed.error.issues.find(
        (issue: core.$ZodIssue) => issue.path[0] === "code",
      )?.message;
      notify("destructive", codeError ?? "Code invalide.");
      return;
    }

    const twoFactorToken = getTwoFactorLoginToken();
    if (!twoFactorToken) {
      notify("destructive", "Session expirée. Reconnectez-vous.");
      router.replace("/login");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(apiUrl("/api/auth/2fa/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken, code: parsed.data.code }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        field?: "code";
        accessToken?: string;
      };

      if (!response.ok) {
        notify(
          "destructive",
          payload.message ?? "Impossible de contacter le serveur, réessayez.",
        );
        return;
      }

      if (payload.success === false) {
        notify("destructive", payload.message ?? "Code invalide ou expiré.");
        return;
      }

      if (
        payload.success !== true ||
        typeof payload.accessToken !== "string" ||
        !payload.accessToken
      ) {
        notify("destructive", "Réponse inattendue du serveur.");
        return;
      }

      clearTwoFactorLoginToken();
      setAccessToken(payload.accessToken);
      stashAuthFeedbackForNextPage({
        variant: "success",
        message: "Connexion validée.",
      });
      router.push("/profile");
    } catch {
      notify("destructive", "Erreur réseau, réessayez dans quelques instants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    const twoFactorToken = getTwoFactorLoginToken();
    if (!twoFactorToken) {
      notify("destructive", "Session expirée. Reconnectez-vous.");
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/auth/2fa/resend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok) {
        notify(
          "destructive",
          payload.message ?? "Impossible de contacter le serveur, réessayez.",
        );
        return;
      }

      if (payload.success === false) {
        notify(
          "destructive",
          payload.message ?? "Impossible de renvoyer le code pour le moment.",
        );
        return;
      }

      if (payload.success !== true) {
        notify("destructive", "Réponse inattendue du serveur.");
        return;
      }

      notify("success", "Un nouveau code vous a été envoyé.");
    } catch {
      notify("destructive", "Erreur réseau pendant le renvoi du code.");
    }
  };

  return (
    <section className="w-full container mx-auto p-4 xl:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Vérification 2FA</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
                <Field>
                  <FieldLabel htmlFor="otp">Code de vérification</FieldLabel>
                  <InputOTP
                    id="otp"
                    maxLength={6}
                    value={code}
                    onChange={setCode}
                    pattern={REGEXP_ONLY_DIGITS}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </Field>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting || code.length !== 6}
                  >
                    {isSubmitting ? "Vérification..." : "Vérifier"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                  >
                    Renvoyer le code
                  </Button>
                </div>
              </form>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>
  );
};

export default TwoAuthPage;
