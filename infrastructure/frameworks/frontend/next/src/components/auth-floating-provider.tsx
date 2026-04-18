"use client";

import * as React from "react";
import {
  FloatingAuthAlert,
  type FloatingAuthFeedback,
} from "@/components/floating-auth-alert";

type QueuedItem = {
  id: string;
  variant: NonNullable<FloatingAuthFeedback>["variant"];
  message: string;
};

export type AuthFloatingContextValue = {
  /** Premier message de la file (affiché dans la bulle). */
  feedback: FloatingAuthFeedback;
  notify: (
    variant: NonNullable<FloatingAuthFeedback>["variant"],
    message: string,
  ) => void;
  /** Retire le message courant et affiche le suivant dans la file. */
  dismiss: () => void;
  /** Vide toute la file. */
  dismissAll: () => void;
  /** Modifie le message courant (variant / texte) sans changer la file. */
  patchCurrent: (patch: {
    message?: string;
    variant?: NonNullable<FloatingAuthFeedback>["variant"];
  }) => void;
};

const AuthFloatingContext =
  React.createContext<AuthFloatingContextValue | null>(null);

export function useAuthFeedback(): AuthFloatingContextValue {
  const ctx = React.useContext(AuthFloatingContext);
  if (!ctx) {
    throw new Error(
      "useAuthFeedback doit être utilisé dans AuthFloatingProvider (layout racine).",
    );
  }
  return ctx;
}

export function AuthFloatingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queue, setQueue] = React.useState<QueuedItem[]>([]);

  const dismiss = React.useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const dismissAll = React.useCallback(() => {
    setQueue([]);
  }, []);

  const notify = React.useCallback(
    (
      variant: NonNullable<FloatingAuthFeedback>["variant"],
      message: string,
    ) => {
      setQueue((q) => [...q, { id: crypto.randomUUID(), variant, message }]);
    },
    [],
  );

  const patchCurrent = React.useCallback(
    (patch: {
      message?: string;
      variant?: NonNullable<FloatingAuthFeedback>["variant"];
    }) => {
      setQueue((q) => {
        if (q.length === 0) {
          return q;
        }
        const [first, ...rest] = q;
        return [{ ...first, ...patch }, ...rest];
      });
    },
    [],
  );

  const feedback = React.useMemo((): FloatingAuthFeedback => {
    const item = queue[0];
    return item ? { variant: item.variant, message: item.message } : null;
  }, [queue]);

  const value = React.useMemo(
    () => ({
      feedback,
      notify,
      dismiss,
      dismissAll,
      patchCurrent,
    }),
    [feedback, notify, dismiss, dismissAll, patchCurrent],
  );

  return (
    <AuthFloatingContext.Provider value={value}>
      {children}
      <FloatingAuthAlert
        feedback={feedback}
        toastKey={queue[0]?.id ?? null}
        onDismiss={dismiss}
      />
    </AuthFloatingContext.Provider>
  );
}
