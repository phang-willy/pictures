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
    confirmPassword: z.string().min(1, 'Confirme ton mot de passe'),
  })
  .refine(
    (data: { email: string; password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Les mots de passe ne correspondent pas',
    },
  );

export const changePasswordFormSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme ton mot de passe'),
  })
  .refine(
    (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
      data.newPassword === data.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Les mots de passe ne correspondent pas',
    },
  );

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type TwoFactorFormValues = z.infer<typeof twoFactorFormSchema>;
export type ForgotPasswordRequestFormValues = z.infer<
  typeof forgotPasswordRequestFormSchema
>;
export type ForgotPasswordNewFormValues = z.infer<typeof forgotPasswordNewFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
