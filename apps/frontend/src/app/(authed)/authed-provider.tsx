"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { consumePendingAuthFeedback, stashAuthFeedbackForNextPage } from "@/lib/auth-feedback-handoff";
import { clearAccessToken, clearTwoFactorLoginToken, getAccessToken } from "@/lib/auth-session";
import { FloatingAuthAlert } from "@/components/floating-auth-alert";
import { useAuthFeedback } from "@/hooks/use-auth-feedback";

export type AuthedUser = { email: string; role: string };

type AuthedStatus = "loading" | "authenticated" | "unauthenticated";

type AuthedContextValue = {
  user: AuthedUser | null;
  status: AuthedStatus;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthedContext = createContext<AuthedContextValue | null>(null);

export function useAuthed(): AuthedContextValue {
  const ctx = useContext(AuthedContext);
  if (!ctx) {
    throw new Error("useAuthed doit être utilisé dans AuthedProvider");
  }
  return ctx;
}

export function AuthedProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { feedback, notify, dismiss } = useAuthFeedback();
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [status, setStatus] = useState<AuthedStatus>("loading");
  const firstLoadDone = useRef(false);

  const redirectToLogin = useCallback(() => {
    clearAccessToken();
    clearTwoFactorLoginToken();
    startTransition(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
    router.replace("/login");
  }, [router]);

  const verify = useCallback(
    async (signal: AbortSignal) => {
      const token = getAccessToken();
      if (!token) {
        redirectToLogin();
        return;
      }

      if (!firstLoadDone.current) {
        startTransition(() => setStatus("loading"));
      }

      try {
        const response = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });
        const payload = (await response.json()) as {
          success?: boolean;
          email?: string;
          role?: string;
        };

        if (signal.aborted) {
          return;
        }

        if (
          payload.success !== true ||
          typeof payload.email !== "string" ||
          typeof payload.role !== "string"
        ) {
          redirectToLogin();
          return;
        }

        const { email, role } = payload;
        startTransition(() => {
          setUser({ email, role });
          setStatus("authenticated");
        });
        firstLoadDone.current = true;
      } catch (cause) {
        if (signal.aborted || (cause instanceof DOMException && cause.name === "AbortError")) {
          return;
        }
        redirectToLogin();
      }
    },
    [redirectToLogin],
  );

  useEffect(() => {
    const ac = new AbortController();
    void verify(ac.signal);
    return () => ac.abort();
  }, [verify, pathname]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    const pending = consumePendingAuthFeedback();
    if (pending) {
      notify(pending.variant, pending.message);
    }
  }, [status, notify]);

  const logout = useCallback(() => {
    clearAccessToken();
    clearTwoFactorLoginToken();
    firstLoadDone.current = false;
    stashAuthFeedbackForNextPage({
      variant: "info",
      message: "Vous êtes bien déconnecté.",
    });
    startTransition(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
    router.replace("/login");
  }, [router]);

  const refresh = useCallback(() => {
    const ac = new AbortController();
    return verify(ac.signal);
  }, [verify]);

  const value = React.useMemo<AuthedContextValue>(
    () => ({
      user,
      status,
      logout,
      refresh,
    }),
    [user, status, logout, refresh],
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <AuthedContext.Provider value={value}>
      <FloatingAuthAlert feedback={feedback} placement="top" onDismiss={dismiss} />
      {children}
    </AuthedContext.Provider>
  );
}
