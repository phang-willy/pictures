import { z, type RefinementCtx } from "zod";

export const emailSchema = z.email("Adresse email invalide");

/** Caracteres autorises dans le mot de passe (hors contraintes min/maj/chiffre/special). */
const PASSWORD_CHARS = /^[A-Za-z\d()/*\-+./\\@!{}&]+$/;

export const passwordSchema = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caracteres")
  .max(255, "Le mot de passe est trop long")
  .superRefine((val: string, ctx: RefinementCtx) => {
    if (!PASSWORD_CHARS.test(val)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Veuillez utiliser uniquement des lettres, chiffres et caractères spéciaux autorisés: ()/*-+./\\@!{}&",
      });
      return;
    }
    if (!/[a-z]/.test(val)) {
      ctx.addIssue({
        code: "custom",
        message: "Le mot de passe doit contenir au moins une lettre minuscule",
      });
    }
    if (!/[A-Z]/.test(val)) {
      ctx.addIssue({
        code: "custom",
        message: "Le mot de passe doit contenir au moins une lettre majuscule",
      });
    }
    if (!/\d/.test(val)) {
      ctx.addIssue({
        code: "custom",
        message: "Le mot de passe doit contenir au moins un chiffre",
      });
    }
    if (!/[()/*\-+./\\@!{}&]/.test(val)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Le mot de passe doit contenir au moins un caractère spécial parmi: ()/*-+./\\@!{}&",
      });
    }
  });

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Le code doit contenir exactement 6 chiffres");
