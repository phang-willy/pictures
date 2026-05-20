"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BreadcrumbLabels = Record<string, string>;

type BreadcrumbLabelsContextValue = {
  labels: BreadcrumbLabels;
  registerLabel: (href: string, label: string) => () => void;
};

const BreadcrumbLabelsContext =
  createContext<BreadcrumbLabelsContextValue | null>(null);

function normalizeHref(href: string): string {
  const path = href.split("?")[0]?.split("#")[0] ?? "";
  const normalized = `/${path.split("/").filter(Boolean).join("/")}`;
  return normalized === "/" ? "/" : normalized;
}

export function BreadcrumbLabelsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [labels, setLabels] = useState<BreadcrumbLabels>({});

  const registerLabel = useCallback((href: string, label: string) => {
    const key = normalizeHref(href);
    setLabels((current) =>
      current[key] === label ? current : { ...current, [key]: label },
    );

    return () => {
      setLabels((current) => {
        if (current[key] !== label) {
          return current;
        }
        const next = { ...current };
        delete next[key];
        return next;
      });
    };
  }, []);

  const value = useMemo(
    () => ({ labels, registerLabel }),
    [labels, registerLabel],
  );

  return (
    <BreadcrumbLabelsContext.Provider value={value}>
      {children}
    </BreadcrumbLabelsContext.Provider>
  );
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbLabelsContext)?.labels ?? {};
}

export function BreadcrumbLabelOverride({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const registerLabel = useContext(BreadcrumbLabelsContext)?.registerLabel;

  useEffect(() => {
    if (!registerLabel) {
      return undefined;
    }
    return registerLabel(href, label);
  }, [href, label, registerLabel]);

  return null;
}
