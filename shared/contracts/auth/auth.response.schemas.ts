import { z } from "zod";

export const authErrorResponseSchema = z.object({
  field: z.enum(["email", "password", "code"]).optional(),
  message: z.string(),
});

export const loginSuccessResponseSchema = z.object({
  requiresTwoFactor: z.boolean(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const registerSuccessResponseSchema = z.object({
  userId: z.string(),
  requiresEmailVerification: z.boolean(),
});

export const verifyTwoFactorSuccessResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;
export type LoginSuccessResponse = z.infer<typeof loginSuccessResponseSchema>;
export type RegisterSuccessResponse = z.infer<typeof registerSuccessResponseSchema>;
export type VerifyTwoFactorSuccessResponse = z.infer<typeof verifyTwoFactorSuccessResponseSchema>;
