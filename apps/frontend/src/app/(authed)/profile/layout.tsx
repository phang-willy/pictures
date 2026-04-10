import type { Metadata } from "next";
import type { ReactNode } from "react";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `${appName} - Profil`,
  description: `Compte et paramètres sur ${appName}`,
  openGraph: {
    title: `${appName} - Profil`,
    description: `Compte et paramètres sur ${appName}`,
    type: "website",
  },
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
