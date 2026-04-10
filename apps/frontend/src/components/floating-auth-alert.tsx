"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type FloatingAuthAlertPlacement = "top" | "bottom";

export type FloatingAuthFeedback = {
  variant: "default" | "destructive" | "success" | "info";
  message: string;
} | null;

type FloatingAuthAlertProps = {
  feedback: FloatingAuthFeedback;
  placement?: FloatingAuthAlertPlacement;
  /** Durée visible avant disparition (ms), dont ~300ms de fondu sortant */
  autoHideMs?: number;
  onDismiss: () => void;
};

export function FloatingAuthAlert({
  feedback,
  placement = "top",
  autoHideMs = 5500,
  onDismiss,
}: FloatingAuthAlertProps) {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [countdownKey, setCountdownKey] = React.useState(0);
  const dismissRef = React.useRef(onDismiss);

  React.useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useLayoutEffect(() => {
    if (feedback) {
      setCountdownKey((k) => k + 1);
    }
  }, [feedback]);

  React.useEffect(() => {
    if (!feedback) {
      setVisible(false);
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    const showFrame = requestAnimationFrame(() => {
      setVisible(true);
    });

    const fadeOutStart = Math.max(800, autoHideMs - 350);
    const fadeOutTimer = window.setTimeout(() => {
      setVisible(false);
    }, fadeOutStart);

    const removeTimer = window.setTimeout(() => {
      dismissRef.current();
    }, autoHideMs);

    return () => {
      cancelAnimationFrame(showFrame);
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(removeTimer);
    };
  }, [feedback, autoHideMs]);

  if (!mounted || !feedback) {
    return null;
  }

  const isSuccess = feedback.variant === "success";
  const isDestructive = feedback.variant === "destructive";
  const isInfo = feedback.variant === "info";

  const countdownTrackClass = isSuccess
    ? "bg-emerald-500/15 dark:bg-emerald-400/15"
    : isDestructive
      ? "bg-destructive/15"
      : isInfo
        ? "bg-primary/15"
        : "bg-foreground/10 dark:bg-white/10";

  const countdownFillClass = isSuccess
    ? "bg-emerald-600 dark:bg-emerald-400"
    : isDestructive
      ? "bg-destructive"
      : isInfo
        ? "bg-primary"
        : "bg-foreground/55 dark:bg-white/55";

  const node = (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-100 flex justify-center px-4 transition-all duration-300 ease-out",
        placement === "top" ? "top-4" : "bottom-4",
        visible
          ? "translate-y-0 opacity-100"
          : placement === "top"
            ? "-translate-y-3 opacity-0"
            : "translate-y-3 opacity-0",
      )}
      aria-live="polite"
    >
      <div className="pointer-events-auto w-full max-w-lg shadow-lg">
        <Alert
          variant={
            isSuccess ? "success" : isDestructive ? "destructive" : "default"
          }
          className={cn(
            "shadow-md",
            "[&>svg]:size-6 [&>svg]:shrink-0 [&>svg]:translate-y-0.5",
          )}
        >
          {isSuccess ? (
            <CheckCircle2
              className="text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
          ) : isDestructive ? (
            <AlertCircle className="text-destructive" aria-hidden />
          ) : isInfo ? (
            <Info className="text-primary" aria-hidden />
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            <AlertTitle>
              {isSuccess
                ? "Succès"
                : isDestructive
                  ? "Erreur"
                  : isInfo
                    ? "Info"
                    : "Information"}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
            <div
              className={cn(
                "h-1 w-full overflow-hidden rounded-full",
                countdownTrackClass,
              )}
              aria-hidden
            >
              <div
                key={countdownKey}
                className={cn(
                  "h-full w-full origin-left rounded-full will-change-transform",
                  countdownFillClass,
                )}
                style={{
                  animation: `floating-auth-alert-countdown ${autoHideMs}ms linear forwards`,
                }}
              />
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
