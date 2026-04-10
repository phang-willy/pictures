"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { registerFormSchema } from "@shared/schemas";
import { apiUrl } from "@/lib/api";
import { FloatingAuthAlert } from "@/components/floating-auth-alert";
import { useAuthFeedback } from "@/hooks/use-auth-feedback";

type FormSubmitEvent = Parameters<
  NonNullable<React.ComponentProps<"form">["onSubmit"]>
>[0];

type RegisterErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const DUPLICATE_EMAIL_MESSAGE =
  "Un compte existe peut-être déjà avec cet email. Essayez de vous connecter ou réinitialisez votre mot de passe.";

function summarizeZodIssues(messages: string[]): string {
  const unique = [...new Set(messages)];
  if (unique.length === 0) {
    return "Veuillez corriger les champs du formulaire.";
  }
  if (unique.length <= 2) {
    return unique.join(" ");
  }
  return `${unique.slice(0, 2).join(" ")} …`;
}

const RegisterPage = () => {
  const { feedback, notify, dismiss } = useAuthFeedback();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (errors[name as keyof RegisterErrors]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }

    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setErrors({});

    const parsed = registerFormSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: RegisterErrors = {};
      const messages: string[] = [];
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (
          path === "email" ||
          path === "password" ||
          path === "confirmPassword"
        ) {
          const key: keyof RegisterErrors = path;
          nextErrors[key] = nextErrors[key] ?? issue.message;
        }
        messages.push(issue.message);
      }
      setErrors(nextErrors);
      notify("destructive", summarizeZodIssues(messages));
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        field?: "email" | "password" | "confirmPassword";
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
        if (payload.field === "email") {
          notify("destructive", payload.message ?? DUPLICATE_EMAIL_MESSAGE);
          return;
        }

        if (
          payload.field === "password" ||
          payload.field === "confirmPassword"
        ) {
          setErrors({ [payload.field]: payload.message ?? "Champ invalide" });
          notify("destructive", payload.message ?? "Une erreur est survenue.");
          return;
        }

        notify(
          "destructive",
          payload.message ?? "Impossible de créer le compte, réessayez.",
        );
        return;
      }

      if (payload.success !== true) {
        notify("destructive", "Réponse inattendue du serveur.");
        return;
      }

      notify(
        "success",
        "Inscription enregistrée. Consultez vos e-mails pour confirmer votre compte avant de vous connecter.",
      );
    } catch {
      notify(
        "destructive",
        "Erreur réseau, veuillez vérifier votre connexion puis réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FloatingAuthAlert
        feedback={feedback}
        placement="top"
        onDismiss={dismiss}
      />
      <section className="w-full container mx-auto p-4 xl:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Inscription</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="myemail@example.com"
                    required
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                  {errors.email ? (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      required
                      value={form.password}
                      onChange={handleChange}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      tabIndex={-1}
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 focus:outline-none"
                      aria-label={
                        showPassword
                          ? "Masquer mot de passe"
                          : "Montrer mot de passe"
                      }
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Button>
                  </div>
                  {errors.password ? (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmer le mot de passe"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="pr-10"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((previous) => !previous)
                      }
                      tabIndex={-1}
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 focus:outline-none"
                      aria-label={
                        showConfirmPassword
                          ? "Masquer confirmation du mot de passe"
                          : "Montrer confirmation du mot de passe"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
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
                  {isSubmitting ? "Création..." : "Créer mon compte"}
                </Button>
              </form>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>
    </>
  );
};

export default RegisterPage;
