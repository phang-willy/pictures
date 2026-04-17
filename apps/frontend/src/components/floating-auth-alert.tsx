"use client";

import * as React from "react";
import { toast } from "sonner";

export type FloatingAuthFeedback = {
  variant: "default" | "destructive" | "success" | "info";
  message: string;
} | null;

type FloatingAuthAlertProps = {
  feedback: FloatingAuthFeedback;
  toastKey: string | null;
  autoHideMs?: number;
  onDismiss: () => void;
};

function titleForVariant(
  variant: NonNullable<FloatingAuthFeedback>["variant"],
): string {
  switch (variant) {
    case "success":
      return "Succès";
    case "destructive":
      return "Erreur";
    case "info":
      return "Info";
    default:
      return "Information";
  }
}

export function FloatingAuthAlert({
  feedback,
  toastKey,
  autoHideMs = 5500,
  onDismiss,
}: FloatingAuthAlertProps) {
  const dismissRef = React.useRef(onDismiss);

  React.useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  React.useEffect(() => {
    if (!toastKey || !feedback) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    const title = titleForVariant(feedback.variant);
    const options = {
      description: feedback.message,
      duration: autoHideMs,
      onDismiss: () => {
        dismissRef.current();
      },
    } as const;

    switch (feedback.variant) {
      case "success":
        toast.success(title, options);
        break;
      case "destructive":
        toast.error(title, options);
        break;
      case "info":
        toast.info(title, options);
        break;
      default:
        toast(title, options);
        break;
    }
  }, [toastKey, feedback, autoHideMs]);

  return null;
}
