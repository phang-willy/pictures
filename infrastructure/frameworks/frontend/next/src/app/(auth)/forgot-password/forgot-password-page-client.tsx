"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  forgotPasswordNewFormSchema,
  forgotPasswordRequestFormSchema,
} from "@/modules/auth/forms/auth.form.schemas";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiUrl } from "@/lib/api";
import { toast } from "sonner";

type ForgotPageMode =
  | { kind: "request" }
  | { kind: "bad_link" }
  | { kind: "reset"; token: string };

type FormSubmitEvent = Parameters<
  NonNullable<React.ComponentProps<"form">["onSubmit"]>
>[0];

type RequestPayload = { success?: boolean; message?: string };

type ResetPayload = {
  success?: boolean;
  message?: string;
  field?: "email" | "password" | "confirmPassword";
};

type IssueLike = { path: readonly PropertyKey[]; message: string };

function firstMessageForField(
  issues: readonly IssueLike[],
  field: PropertyKey,
): string | undefined {
  return issues.find((i) => i.path[0] === field)?.message;
}

function fieldErrorsFromRequestParse(issues: readonly IssueLike[]): {
  email?: string;
} {
  return { email: firstMessageForField(issues, "email") };
}

function fieldErrorsFromResetParse(issues: readonly IssueLike[]): {
  email?: string;
  password?: string;
  confirmPassword?: string;
} {
  return {
    email: firstMessageForField(issues, "email"),
    password: firstMessageForField(issues, "password"),
    confirmPassword: firstMessageForField(issues, "confirmPassword"),
  };
}

async function requestForgotPasswordLink(body: {
  email: string;
}): Promise<RequestPayload> {
  const response = await fetch(apiUrl("/api/auth/forgot-password/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json().catch(() => ({}))) as RequestPayload;
}

async function resetPasswordWithToken(body: {
  token: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ResetPayload> {
  const response = await fetch(apiUrl("/api/auth/forgot-password/reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json().catch(() => ({}))) as ResetPayload;
}

function resolveForgotPageMode(searchParams: URLSearchParams): ForgotPageMode {
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  if (type === "new") {
    if (token && token.trim().length > 0) {
      return { kind: "reset", token: token.trim() };
    }
    return { kind: "bad_link" };
  }
  return { kind: "request" };
}

function BadLinkSection() {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Ce lien de réinitialisation est incomplet ou a été coupé. Demandez un
        nouvel e-mail depuis le formulaire ci-dessous ou retournez à la page
        d’accueil de cette procédure.
      </p>
      <Button asChild variant="secondary">
        <Link href="/forgot-password">Demander un nouveau lien</Link>
      </Button>
    </div>
  );
}

type RequestFormProps = {
  email: string;
  errors: { email?: string };
  isSubmitting: boolean;
  doneMessage: string | null;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormSubmitEvent) => void;
};

function RequestFormSection({
  email,
  errors,
  isSubmitting,
  doneMessage,
  onEmailChange,
  onSubmit,
}: RequestFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8">
      <p className="text-sm text-muted-foreground">
        Indiquez l’adresse e-mail de votre compte. Nous vous enverrons un lien
        sécurisé pour définir un nouveau mot de passe (valable une heure).
      </p>
      <Field>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={onEmailChange}
          placeholder="vous@exemple.com"
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        ) : null}
      </Field>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Envoi…" : "Envoyer le lien"}
      </Button>
      {doneMessage ? (
        <p className="text-sm text-muted-foreground border border-border rounded-md p-3 bg-muted/40">
          {doneMessage}
        </p>
      ) : null}
    </form>
  );
}

type ResetFormProps = {
  form: { email: string; password: string; confirmPassword: string };
  errors: { email?: string; password?: string; confirmPassword?: string };
  isSubmitting: boolean;
  showPw: boolean;
  showPw2: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePw: () => void;
  onTogglePw2: () => void;
  onSubmit: (e: FormSubmitEvent) => void;
};

function ResetFormSection({
  form,
  errors,
  isSubmitting,
  showPw,
  showPw2,
  onChange,
  onTogglePw,
  onTogglePw2,
  onSubmit,
}: ResetFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8">
      <p className="text-sm text-muted-foreground">
        Saisissez la même adresse e-mail que celle du compte concerné, puis
        choisissez un nouveau mot de passe. Le lien expire au bout d’une heure.
      </p>
      <Field>
        <FieldLabel htmlFor="re-email">E-mail du compte</FieldLabel>
        <Input
          id="re-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={onChange}
          placeholder="vous@exemple.com"
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        ) : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="new-password">Nouveau mot de passe</FieldLabel>
        <div className="relative">
          <Input
            id="new-password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            value={form.password}
            onChange={onChange}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 right-0 px-3"
            onClick={onTogglePw}
            aria-label={
              showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
          >
            {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
          </Button>
        </div>
        {errors.password ? (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        ) : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="confirm-password">Confirmation</FieldLabel>
        <div className="relative">
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showPw2 ? "text" : "password"}
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={onChange}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 right-0 px-3"
            onClick={onTogglePw2}
            aria-label={
              showPw2 ? "Masquer la confirmation" : "Afficher la confirmation"
            }
          >
            {showPw2 ? <EyeOff size={20} /> : <Eye size={20} />}
          </Button>
        </div>
        {errors.confirmPassword ? (
          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
        ) : null}
      </Field>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}

function cardTitleForMode(mode: ForgotPageMode): string {
  if (mode.kind === "reset") return "Nouveau mot de passe";
  if (mode.kind === "bad_link") return "Lien incomplet";
  return "Mot de passe oublié";
}

export function ForgotPasswordPageClient() {
  const searchParams = useSearchParams();

  const mode = useMemo(
    () => resolveForgotPageMode(searchParams),
    [searchParams],
  );

  const [requestForm, setRequestForm] = useState({ email: "" });
  const [resetForm, setResetForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [requestErrors, setRequestErrors] = useState<{ email?: string }>({});
  const [resetErrors, setResetErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestDoneMessage, setRequestDoneMessage] = useState<string | null>(
    null,
  );
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (requestErrors[name as keyof typeof requestErrors]) {
      setRequestErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setRequestForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (resetErrors[name as keyof typeof resetErrors]) {
      setResetErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setResetForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitRequest = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setRequestErrors({});
    setRequestDoneMessage(null);

    const parsed = forgotPasswordRequestFormSchema.safeParse(requestForm);
    if (!parsed.success) {
      const errs = fieldErrorsFromRequestParse(parsed.error.issues);
      setRequestErrors(errs);
      toast.error(errs.email ?? "Vérifiez l'adresse e-mail saisie.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = await requestForgotPasswordLink(parsed.data);

      if (payload.success === false) {
        toast.error(payload.message ?? "Une erreur est survenue, réessayez.");
        return;
      }

      const msg =
        typeof payload.message === "string" && payload.message.length > 0
          ? payload.message
          : "Si un compte correspond, un e-mail va vous être envoyé.";
      setRequestDoneMessage(msg);
      toast.success(msg);
    } catch {
      toast.error("Erreur réseau, vérifiez votre connexion puis réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReset = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setResetErrors({});

    const parsed = forgotPasswordNewFormSchema.safeParse(resetForm);
    if (!parsed.success) {
      const errs = fieldErrorsFromResetParse(parsed.error.issues);
      setResetErrors(errs);
      const parts = [errs.email, errs.password, errs.confirmPassword].filter(
        Boolean,
      ) as string[];
      toast.error(
        parts.length > 0 ? parts.join(" ") : "Vérifiez le formulaire.",
      );
      return;
    }

    if (mode.kind !== "reset") {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = await resetPasswordWithToken({
        token: mode.token,
        email: parsed.data.email,
        password: parsed.data.password,
        confirmPassword: parsed.data.confirmPassword,
      });

      if (payload.success === false) {
        const f = payload.field;
        if (f === "email") {
          setResetErrors({ email: payload.message });
        } else if (f === "password") {
          setResetErrors({ password: payload.message });
        } else if (f === "confirmPassword") {
          setResetErrors({ confirmPassword: payload.message });
        }
        toast.error(
          payload.message ?? "Impossible de mettre à jour le mot de passe.",
        );
        return;
      }

      toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
      setResetForm({ email: "", password: "", confirmPassword: "" });
    } catch {
      toast.error("Erreur réseau, vérifiez votre connexion puis réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full container mx-auto p-4 xl:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{cardTitleForMode(mode)}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {mode.kind === "bad_link" ? (
              <BadLinkSection />
            ) : mode.kind === "request" ? (
              <RequestFormSection
                email={requestForm.email}
                errors={requestErrors}
                isSubmitting={isSubmitting}
                doneMessage={requestDoneMessage}
                onEmailChange={handleRequestChange}
                onSubmit={submitRequest}
              />
            ) : (
              <ResetFormSection
                form={resetForm}
                errors={resetErrors}
                isSubmitting={isSubmitting}
                showPw={showPw}
                showPw2={showPw2}
                onChange={handleResetChange}
                onTogglePw={() => setShowPw((v) => !v)}
                onTogglePw2={() => setShowPw2((v) => !v)}
                onSubmit={submitReset}
              />
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-between">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            Retour à la connexion
          </Link>
          {mode.kind === "reset" ? (
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:underline"
            >
              Nouvelle demande de lien
            </Link>
          ) : null}
        </CardFooter>
      </Card>
    </section>
  );
}
