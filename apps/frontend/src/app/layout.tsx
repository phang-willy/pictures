import type { Metadata } from "next";
import "./globals.css";
import { Inter, Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthFloatingProvider } from "@/components/auth-floating-provider";
import { appName } from "@/lib/app-name";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: `${appName} - Home`,
    template: `${appName} - %s`,
  },
  description: `${appName} web application`,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: `${appName} - Home`,
    description: `${appName} web application`,
    siteName: appName,
    type: "website",
    locale: "fr_FR",
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
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        inter.variable,
        outfitHeading.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthFloatingProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </AuthFloatingProvider>
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
