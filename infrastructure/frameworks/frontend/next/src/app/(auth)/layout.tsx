import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { ModeToggle } from "@/components/toggle-theme";
import { appName } from "@/config/app-name";

export const metadata: Metadata = {
  title: "Auth",
  description: `Espace authentification de ${appName}`,
  openGraph: {
    title: `${appName} - Auth`,
    description: `Espace authentification de ${appName}`,
    type: "website",
  },
};

type AuthLayoutProps = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen grid grid-cols-1 xl:grid-cols-2">
      <aside className="hidden bg-gray-100 dark:bg-gray-900 xl:flex xl:flex-col xl:justify-center xl:items-center">
        <div className="w-full h-full flex justify-center items-center">
          <span className="text-3xl font-bold text-gray-400">Auth Side</span>
        </div>
      </aside>
      <div className="flex flex-col items-center h-full">
        <header className="w-full container mx-auto p-4 xl:p-8">
          <nav className="flex justify-between items-center">
            <ul className="flex items-center gap-4">
              <li>
                <Link href="/" className="text-2xl font-bold">
                  {appName}
                </Link>
              </li>
            </ul>
            <ul className="flex items-center gap-4">
              <li>
                <ModeToggle />
              </li>
            </ul>
          </nav>
        </header>
        <main className="w-full flex-1 flex items-center justify-center">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
