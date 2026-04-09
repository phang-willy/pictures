import type { NextConfig } from "next";

/** Relatif à `apps/frontend/next.config.ts` → racine du dépôt. */
const monorepoRoot = "../..";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/** Expose le nom d’app au bundle client : `APP_NAME` seul n’y est pas visible (règle Next.js). */
const publicAppName =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || process.env.APP_NAME?.trim() || "Pictures";

/** Même logique que `register/layout` et l’API : inscription désactivée si `REGISTER_ON` ≠ `true`. */
const publicRegisterOn = process.env.REGISTER_ON === "true" ? "true" : "";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_APP_NAME: publicAppName,
    NEXT_PUBLIC_REGISTER_ON: publicRegisterOn,
  },
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      "@shared/schemas": `${monorepoRoot}/shared/schemas`,
      "@shared": `${monorepoRoot}/shared`,
    },
  },
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
