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
    .filter((key) => !key.startsWith("NODE_"))
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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Force metadata to be resolved before streaming for all user agents,
  // so title/meta tags are emitted directly in <head>.
  htmlLimitedBots: /.*/,
  allowedDevOrigins,
  env: nextEnv,
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
