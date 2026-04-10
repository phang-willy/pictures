import type { Metadata } from "next";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `${appName} - Se connecter`,
  description: `Se connecter à ${appName}`,
  openGraph: {
    title: `${appName} - Se connecter`,
    description: `Se connecter à ${appName}`,
    type: "website",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
