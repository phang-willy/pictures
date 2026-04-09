import type { Metadata } from "next";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `${appName} - 2FA`,
  description: `Verification 2FA à ${appName}`,
  openGraph: {
    title: `${appName} - 2FA`,
    description: `Verification 2FA à ${appName}`,
    type: "website",
  },
};

export default function TwoAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
