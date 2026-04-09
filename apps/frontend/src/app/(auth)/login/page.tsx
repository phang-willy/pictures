"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginFormSchema } from "@shared/schemas";
import { apiUrl } from "@/lib/api";
import { consumePendingAuthFeedback, stashAuthFeedbackForNextPage } from "@/lib/auth-feedback-handoff";
import { setTwoFactorLoginToken } from "@/lib/auth-session";
import { FloatingAuthAlert } from "@/components/floating-auth-alert";
import { useAuthFeedback } from "@/hooks/use-auth-feedback";

type FormSubmitEvent = Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0];

const LoginPage = () => {
  const router = useRouter();
  const { feedback, notify, dismiss } = useAuthFeedback();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const pending = consumePendingAuthFeedback();
    if (pending) {
      notify(pending.variant, pending.message);
    }
  }, [notify]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setErrors({});

    const parsed = loginFormSchema.safeParse(form);
    if (!parsed.success) {
      const emailError = parsed.error.issues.find((issue) => issue.path[0] === "email")?.message;
      const passwordError = parsed.error.issues.find((issue) => issue.path[0] === "password")?.message;
      setErrors({
        email: emailError,
        password: passwordError,
      });
      const parts = [emailError, passwordError].filter(Boolean) as string[];
      notify("destructive", parts.length > 0 ? parts.join(" ") : "Veuillez corriger les champs du formulaire.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        field?: "email" | "password";
        message?: string;
        twoFactorToken?: string;
      };

      if (!response.ok) {
        notify("destructive", payload.message ?? "Impossible de contacter le serveur, réessayez.");
        return;
      }

      if (payload.success === false) {
        if (payload.field === "email") {
          setErrors({ email: payload.message ?? "Veuillez vérifier vos identifiants." });
          notify("destructive", payload.message ?? "Veuillez vérifier vos identifiants.");
          return;
        }

        if (payload.field === "password") {
          setErrors({ password: payload.message ?? "Veuillez vérifier vos identifiants." });
          notify("destructive", payload.message ?? "Veuillez vérifier vos identifiants.");
          return;
        }

        notify("destructive", payload.message ?? "Impossible de se connecter, réessayez.");
        return;
      }

      if (payload.success !== true || typeof payload.twoFactorToken !== "string" || !payload.twoFactorToken) {
        notify("destructive", "Réponse inattendue du serveur.");
        return;
      }

      stashAuthFeedbackForNextPage({
        variant: "success",
        message: "Un code de vérification vous a été envoyé par e-mail.",
      });
      setTwoFactorLoginToken(payload.twoFactorToken);
      router.push("/2auth");
    } catch {
      notify("destructive", "Erreur réseau, veuillez vérifier votre connexion puis réessayer.");
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
            <CardTitle className="text-3xl">Connexion</CardTitle>
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
                  {errors.email ? <p className="mt-1 text-sm text-red-500">{errors.email}</p> : null}
                </Field>
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                    <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline focus:underline">Mot de passe oublié ?</Link>
                  </div>
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
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      onClick={togglePasswordVisibility}
                      tabIndex={-1}
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 focus:outline-none"
                      aria-label={showPassword ? "Masquer mot de passe" : "Montrer mot de passe"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Button>
                  </div>
                  {errors.password ? <p className="mt-1 text-sm text-red-500">{errors.password}</p> : null}
                </Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </FieldGroup>
          </CardContent>

          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ? <Link href="/register" className="hover:underline focus:underline">Créer un compte</Link>
            </p>
          </CardFooter>
        </Card>
      </section>
    </>
  );
};

export default LoginPage;
