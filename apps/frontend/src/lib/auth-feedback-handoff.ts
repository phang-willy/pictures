import type { FloatingAuthFeedback } from "@/components/floating-auth-alert";

const STORAGE_KEY = "pictures.authFeedbackHandoff";

export type StashedAuthFeedback = NonNullable<FloatingAuthFeedback>;

export function stashAuthFeedbackForNextPage(
  feedback: StashedAuthFeedback,
): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(feedback));
  } catch {
    // quota / navigation privée
  }
}

export function consumePendingAuthFeedback(): StashedAuthFeedback | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const { variant, message } = parsed as {
      variant?: unknown;
      message?: unknown;
    };
    if (
      (variant === "default" ||
        variant === "destructive" ||
        variant === "success" ||
        variant === "info") &&
      typeof message === "string"
    ) {
      return { variant, message };
    }
  } catch {
    // ignore
  }
  return null;
}
