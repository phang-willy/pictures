import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `Starter Full Stack`,
  description: `Starter Full Stack`,
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll="smooth"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
