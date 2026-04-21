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
import { twoFactorFormSchema } from "@/modules/auth/forms/auth.form.schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  clearTwoFactorLoginToken,
  getTwoFactorLoginToken,
} from "@/lib/auth-session";
import { toast } from "sonner";

type FormSubmitEvent = Parameters<
  NonNullable<React.ComponentProps<"form">["onSubmit"]>
>[0];

const TwoAuthPage = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getTwoFactorLoginToken();
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();

    const parsed = twoFactorFormSchema.safeParse({ code });
    if (!parsed.success) {
      const codeError = parsed.error.issues.find(
        (issue: core.$ZodIssue) => issue.path[0] === "code",
      )?.message;
      toast.error(codeError ?? "Code invalide.");
      return;
    }

    const twoFactorToken = getTwoFactorLoginToken();
    if (!twoFactorToken) {
      toast.error("Session expirée. Reconnectez-vous.");
      router.replace("/login");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiFetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken, code: parsed.data.code }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        field?: "code";
      };

      if (!response.ok) {
        toast.error(
          payload.message ?? "Impossible de contacter le serveur, réessayez.",
        );
        return;
      }

      if (payload.success === false) {
        toast.error(payload.message ?? "Code invalide ou expiré.");
        return;
      }

      if (payload.success !== true) {
        toast.error("Réponse inattendue du serveur.");
        return;
      }

      clearTwoFactorLoginToken();
      toast.success("Connexion validée.");
      router.push("/profile");
    } catch {
      toast.error("Erreur réseau, réessayez dans quelques instants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    const twoFactorToken = getTwoFactorLoginToken();
    if (!twoFactorToken) {
      toast.error("Session expirée. Reconnectez-vous.");
      router.replace("/login");
      return;
    }

    try {
      const response = await apiFetch("/api/auth/2fa/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok) {
        toast.error(
          payload.message ?? "Impossible de contacter le serveur, réessayez.",
        );
        return;
      }

      if (payload.success === false) {
        toast.error(
          payload.message ?? "Impossible de renvoyer le code pour le moment.",
        );
        return;
      }

      if (payload.success !== true) {
        toast.error("Réponse inattendue du serveur.");
        return;
      }

      toast.success("Un nouveau code vous a été envoyé.");
    } catch {
      toast.error("Erreur réseau pendant le renvoi du code.");
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
