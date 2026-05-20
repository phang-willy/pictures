import type { Metadata } from "next";
import { appName } from "@/config/app-name";

export const metadata: Metadata = {
  title: `${appName} - Mot de passe oublié`,
  description: `Réinitialiser le mot de passe sur ${appName}`,
  openGraph: {
    title: `${appName} - Mot de passe oublié`,
    description: `Réinitialiser le mot de passe sur ${appName}`,
    type: "website",
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
