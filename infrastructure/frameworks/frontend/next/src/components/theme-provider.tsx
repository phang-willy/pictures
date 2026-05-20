"use client";

import * as React from "react";

const STORAGE_KEY = "theme";

type ConcreteTheme = "light" | "dark";

function systemPreference(): ConcreteTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function parseStored(raw: string | null): string | null {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return null;
}

function readPreference(defaultTheme: string): string {
  try {
    return parseStored(localStorage.getItem(STORAGE_KEY)) ?? defaultTheme;
  } catch {
    return defaultTheme;
  }
}

function resolveConcrete(
  pref: string,
  enableSystem: boolean,
): ConcreteTheme {
  if (pref === "system") {
    return enableSystem ? systemPreference() : "light";
  }
  if (pref === "dark" || pref === "light") return pref;
  return "light";
}

function applyHtml(pref: string, enableSystem: boolean) {
  const resolved = resolveConcrete(pref, enableSystem);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function flashDisableTransitions() {
  const el = document.createElement("style");
  el.setAttribute("data-theme-transition-lock", "");
  el.textContent =
    "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}";
  document.head.appendChild(el);
  window.getComputedStyle(document.body);
  setTimeout(() => el.remove(), 1);
}

export type ThemeContextState = {
  theme: string;
  setTheme: (theme: React.SetStateAction<string>) => void;
  resolvedTheme?: string;
  themes: string[];
  systemTheme?: "light" | "dark";
};

const ThemeContext = React.createContext<ThemeContextState | undefined>(
  undefined,
);

export function useTheme(): ThemeContextState {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system",
      setTheme: () => {},
      resolvedTheme: undefined,
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
    };
  }
  return ctx;
}

export type ThemeProviderProps = {
  children: React.ReactNode;
  /** Compat API next-themes - ignoré (classes `light` / `dark` sur `document.documentElement`). */
  attribute?: "class" | `data-${string}`;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [preference, setPreference] = React.useState(defaultTheme);
  const [mounted, setMounted] = React.useState(false);
  const [systemTheme, setSystemTheme] = React.useState<
    "light" | "dark" | undefined
  >(undefined);

  React.useLayoutEffect(() => {
    setPreference(readPreference(defaultTheme));
    setSystemTheme(systemPreference());
    setMounted(true);
  }, [defaultTheme]);

  React.useEffect(() => {
    applyHtml(preference, enableSystem);
  }, [preference, enableSystem]);

  React.useEffect(() => {
    if (!enableSystem || preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemPreference();
      setSystemTheme(next);
      applyHtml("system", enableSystem);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference, enableSystem]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = parseStored(e.newValue) ?? defaultTheme;
      setPreference(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [defaultTheme]);

  const setTheme = React.useCallback(
    (value: React.SetStateAction<string>) => {
      setPreference((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* ignore quota / private mode */
        }
        if (disableTransitionOnChange) flashDisableTransitions();
        return next;
      });
    },
    [disableTransitionOnChange],
  );

  const resolvedTheme = mounted
    ? resolveConcrete(preference, enableSystem)
    : undefined;

  const themes = React.useMemo(
    () => (enableSystem ? ["light", "dark", "system"] : ["light", "dark"]),
    [enableSystem],
  );

  const value = React.useMemo(
    (): ThemeContextState => ({
      theme: preference,
      setTheme,
      resolvedTheme,
      themes,
      systemTheme,
    }),
    [preference, setTheme, resolvedTheme, themes, systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
