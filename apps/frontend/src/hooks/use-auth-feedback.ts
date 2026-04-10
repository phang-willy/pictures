"use client";

import * as React from "react";
import type { FloatingAuthFeedback } from "@/components/floating-auth-alert";

export function useAuthFeedback() {
  const [feedback, setFeedback] = React.useState<FloatingAuthFeedback>(null);

  const dismiss = React.useCallback(() => {
    setFeedback(null);
  }, []);

  const notify = React.useCallback(
    (
      variant: NonNullable<FloatingAuthFeedback>["variant"],
      message: string,
    ) => {
      setFeedback({ variant, message });
    },
    [],
  );

  return { feedback, notify, dismiss };
}
