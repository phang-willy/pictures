"use client";

import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  clearLegacyAccessTokenStorage,
  clearTwoFactorLoginToken,
  logoutAuthSession,
} from "@/lib/auth-session";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

export type AuthedUser = { email: string; role: string };

type AuthedStatus = "loading" | "authenticated" | "unauthenticated";

type AuthedContextValue = {
  user: AuthedUser | null;
  status: AuthedStatus;
  isAdmin: boolean;
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
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [status, setStatus] = useState<AuthedStatus>("loading");
  const firstLoadDone = useRef(false);

  const redirectToLogin = useCallback(() => {
    void logoutAuthSession().finally(() => {
      clearTwoFactorLoginToken();
      startTransition(() => {
        setUser(null);
        setStatus("unauthenticated");
      });
      router.replace("/login");
    });
  }, [router]);

  const verify = useCallback(
    async (signal: AbortSignal) => {
      clearLegacyAccessTokenStorage();

      if (!firstLoadDone.current) {
        startTransition(() => setStatus("loading"));
      }

      try {
        const response = await apiFetch("/api/auth/me", { signal });
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
        if (
          signal.aborted ||
          (cause instanceof DOMException && cause.name === "AbortError")
        ) {
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
  }, [status]);

  const logout = useCallback(() => {
    firstLoadDone.current = false;
    void logoutAuthSession().finally(() => {
      clearTwoFactorLoginToken();
      toast.info("Vous êtes bien déconnecté.");
      startTransition(() => {
        setUser(null);
        setStatus("unauthenticated");
      });
      router.replace("/login");
    });
  }, [router]);

  const refresh = useCallback(() => {
    const ac = new AbortController();
    return verify(ac.signal);
  }, [verify]);

  const value = React.useMemo<AuthedContextValue>(
    () => ({
      user,
      status,
      isAdmin: user?.role === "ADMIN",
      logout,
      refresh,
    }),
    [user, status, logout, refresh],
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center text-muted-foreground">
        <span>Chargement</span>
        <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (
    status === "authenticated" &&
    user &&
    pathname.startsWith("/admin") &&
    user.role !== "ADMIN"
  ) {
    notFound();
  }

  return (
    <AuthedContext.Provider value={value}>{children}</AuthedContext.Provider>
  );
}
