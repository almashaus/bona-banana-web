import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/globals.css";
import Header from "@/src/components/layout/header";
import Footer from "@/src/components/layout/footer";
import { Toaster } from "@/src/components/ui/toaster";
import { AuthProvider } from "@/src/features/auth/auth-provider";
import { LanguageProvider } from "@/src/components/i18n/language-provider";
import { MySWRProvider } from "@/src/features/context/swr-provider";
import { DINNextLT } from "../styles/fonts";

export const metadata: Metadata = {
  title: "Bona Banana",
  description: "Book tickets for your favorite game event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/css/riyal.css" />
      </head>
      <body className={DINNextLT.className}>
        <AuthProvider>
          <MySWRProvider>
            <LanguageProvider>
              <Analytics />
              <SpeedInsights />
              <div className="flex flex-col min-h-screen min-w-full">
                <Header />
                <main className="flex-grow pt-16">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </LanguageProvider>
          </MySWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
