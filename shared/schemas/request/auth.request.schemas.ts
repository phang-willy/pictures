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

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type VerifyTwoFactorRequest = z.infer<typeof verifyTwoFactorRequestSchema>;
export type ResendTwoFactorRequest = z.infer<typeof resendTwoFactorRequestSchema>;
