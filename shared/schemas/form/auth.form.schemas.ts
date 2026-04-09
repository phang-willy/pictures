import { z } from "zod";
import { emailSchema, otpCodeSchema, passwordSchema } from "../primitives/auth.primitives";

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
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export const twoFactorFormSchema = z.object({
  code: otpCodeSchema,
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type TwoFactorFormValues = z.infer<typeof twoFactorFormSchema>;
