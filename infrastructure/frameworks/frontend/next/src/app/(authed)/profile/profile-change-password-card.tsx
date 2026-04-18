"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePasswordFormSchema } from "@/modules/auth/forms/auth.form.schemas";
import { apiFetch } from "@/lib/api";
import { stashAuthFeedbackForNextPage } from "@/lib/auth-feedback-handoff";
import {
  clearTwoFactorLoginToken,
  logoutAuthSession,
} from "@/lib/auth-session";
import { useAuthed } from "@/app/(authed)/authed-provider";

type FormSubmitEvent = Parameters<
  NonNullable<React.ComponentProps<"form">["onSubmit"]>
>[0];

type ChangePwdErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export function ProfileChangePasswordCard() {
  const router = useRouter();
  const { user } = useAuthed();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ChangePwdErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (errors[name as keyof ChangePwdErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setFormError(null);
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handlePasswordSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = changePasswordFormSchema.safeParse(form);
    if (!parsed.success) {
      const next: ChangePwdErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (
          path === "oldPassword" ||
          path === "newPassword" ||
          path === "confirmPassword"
        ) {
          next[path] = next[path] ?? issue.message;
        }
      }
      setErrors(next);
      setFormError(
        parsed.error.issues[0]?.message ??
          "Veuillez corriger les champs du formulaire.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch("/api/auth/password/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: parsed.data.oldPassword,
          newPassword: parsed.data.newPassword,
          confirmPassword: parsed.data.confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        field?: keyof ChangePwdErrors;
        message?: string;
      };

      if (!response.ok) {
        setFormError(
          payload.message ?? "Impossible de contacter le serveur, réessayez.",
        );
        return;
      }

      if (payload.success === false) {
        if (
          payload.field === "oldPassword" ||
          payload.field === "newPassword" ||
          payload.field === "confirmPassword"
        ) {
          setErrors({ [payload.field]: payload.message ?? "Champ invalide." });
        }
        setFormError(
          payload.message ?? "Le changement de mot de passe a échoué.",
        );
        return;
      }

      if (payload.success !== true) {
        setFormError("Réponse inattendue du serveur.");
        return;
      }

      await logoutAuthSession();
      clearTwoFactorLoginToken();
      stashAuthFeedbackForNextPage({
        variant: "success",
        message:
          "Mot de passe modifié. Un e-mail de confirmation (avec l'adresse IP utilisée) vous a été envoyé. Reconnectez-vous avec votre nouveau mot de passe.",
      });
      router.replace("/login");
    } catch {
      setFormError(
        "Erreur réseau, veuillez vérifier votre connexion puis réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Changer le mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <form
            onSubmit={handlePasswordSubmit}
            className="grid grid-cols-1 gap-8"
            autoComplete="on"
          >
            {formError ? (
              <p className="text-sm text-red-500" role="alert">
                {formError}
              </p>
            ) : null}
            <label htmlFor="profile-password-username" className="sr-only">
              E-mail (identifiant)
            </label>
            <Input
              id="profile-password-username"
              type="email"
              name="username"
              autoComplete="username"
              value={user?.email ?? ""}
              readOnly
              tabIndex={-1}
              className="sr-only"
            />
            <Field>
              <FieldLabel htmlFor="oldPassword">Ancien mot de passe</FieldLabel>
              <div className="relative">
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOld ? "text" : "password"}
                  placeholder="Ancien mot de passe"
                  required
                  value={form.oldPassword}
                  onChange={handleChange}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  onClick={() => setShowOld((p) => !p)}
                  tabIndex={-1}
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 focus:outline-none"
                  aria-label={
                    showOld ? "Masquer mot de passe" : "Montrer mot de passe"
                  }
                >
                  {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
              {errors.oldPassword ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.oldPassword}
                </p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="newPassword">
                Nouveau mot de passe
              </FieldLabel>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  required
                  value={form.newPassword}
                  onChange={handleChange}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  tabIndex={-1}
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 focus:outline-none"
                  aria-label={
                    showNew ? "Masquer mot de passe" : "Montrer mot de passe"
                  }
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
              {errors.newPassword ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.newPassword}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Doit être différent de vos cinq derniers mots de passe.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirmer le nouveau mot de passe
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirmer le nouveau mot de passe"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  tabIndex={-1}
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 focus:outline-none"
                  aria-label={
                    showConfirm
                      ? "Masquer confirmation du mot de passe"
                      : "Montrer confirmation du mot de passe"
                  }
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              {isSubmitting
                ? "Enregistrement…"
                : "Enregistrer le nouveau mot de passe"}
            </Button>
          </form>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
