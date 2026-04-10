import { z } from "zod";
import { emailSchema, otpCodeSchema, passwordSchema } from "../primitives/auth.primitives";

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** Jeton signé (email + date d'expiration) renvoyé après login, à renvoyer avec le code OTP. */
export const verifyTwoFactorRequestSchema = z.object({
  twoFactorToken: z.string().min(1, 'Session de connexion invalide ou expirée.'),
  code: otpCodeSchema,
});

export const resendTwoFactorRequestSchema = z.object({
  twoFactorToken: z.string().min(1, 'Session de connexion invalide ou expirée.'),
});

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordResetRequestSchema = z
  .object({
    token: z.string().min(1, 'Lien de réinitialisation invalide.'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme ton mot de passe'),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Les mots de passe ne correspondent pas',
    },
  );

export const changePasswordRequestSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme ton mot de passe'),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Les mots de passe ne correspondent pas',
    },
  );

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type VerifyTwoFactorRequest = z.infer<typeof verifyTwoFactorRequestSchema>;
export type ResendTwoFactorRequest = z.infer<typeof resendTwoFactorRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordResetRequest = z.infer<typeof forgotPasswordResetRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
