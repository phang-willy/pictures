import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = path.resolve(process.cwd(), "../../../..");
const contractsPackageRoot = path.join(workspaceRoot, "packages/contracts");

loadEnvConfig(workspaceRoot);

const rootEnvPath = path.join(workspaceRoot, ".env");
const rootEnvKeys = fs.existsSync(rootEnvPath)
  ? fs
      .readFileSync(rootEnvPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=")[0]?.trim())
      .filter((key): key is string => Boolean(key))
  : [];

const nextEnv = Object.fromEntries(
  rootEnvKeys
    .filter((key) => key.startsWith("NEXT_PUBLIC_"))
    .map((key) => [key, process.env[key]])
    .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
);

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? process.env.APP_NAME;
if (appName?.trim()) {
  nextEnv.NEXT_PUBLIC_APP_NAME = appName.trim();
}

const allowedDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

function firstUrl(...values: Array<string | undefined>): string {
  const raw = values.find((value) => value?.trim())?.trim();
  const first = raw?.split(",")[0]?.trim() || "http://localhost:3001";
  return first.replace(/\/$/, "");
}

const uploadsBackendUrl = firstUrl(
  process.env.INTERNAL_API_URL,
  process.env.API_URL,
  process.env.NEXT_PUBLIC_API_URL,
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Force metadata to be resolved before streaming for all user agents,
  // so title/meta tags are emitted directly in <head>.
  htmlLimitedBots: /.*/,
  allowedDevOrigins,
  env: nextEnv,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${uploadsBackendUrl}/uploads/:path*`,
      },
    ];
  },
  output: "standalone",
  experimental: {
    externalDir: true,
  },
  /** Paquet interne ; alias explicite pour éviter les échecs de résolution (symlink file:, Docker, etc.). */
  transpilePackages: ["@pictures/contracts", "@geoman-io/maplibre-geoman-free"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@pictures/contracts": contractsPackageRoot,
    };
    return config;
  },
};

export default nextConfig;
