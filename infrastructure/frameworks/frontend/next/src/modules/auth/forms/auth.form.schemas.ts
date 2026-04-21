import { z } from "zod";

const emailSchema = z.email("Adresse email invalide");

/** Caracteres autorises dans le mot de passe (hors contraintes min/maj/chiffre/special). */
const PASSWORD_CHARS = /^[A-Za-z\d()/*\-+./\\@!{}&]+$/;

const passwordSchema = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caracteres")
  .max(255, "Le mot de passe est trop long")
  .superRefine((val: string, ctx) => {
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

const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Le code doit contenir exactement 6 chiffres");

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine(
    (data: { email: string; password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Les mots de passe ne correspondent pas",
    },
  );

export const twoFactorFormSchema = z.object({
  code: otpCodeSchema,
});

export const forgotPasswordRequestFormSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordNewFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine(
    (data: { email: string; password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Les mots de passe ne correspondent pas",
    },
  );

export const changePasswordFormSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine(
    (data: {
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => data.newPassword === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Les mots de passe ne correspondent pas",
    },
  );

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type TwoFactorFormValues = z.infer<typeof twoFactorFormSchema>;
export type ForgotPasswordRequestFormValues = z.infer<
  typeof forgotPasswordRequestFormSchema
>;
export type ForgotPasswordNewFormValues = z.infer<
  typeof forgotPasswordNewFormSchema
>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
