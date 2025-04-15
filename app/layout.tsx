import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";

const inter = Inter({ subsets: ["latin"] });

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
      <body
        className={inter.className + " bg-gradient-to-b from-muted/50 to-muted"}
      >
        <AuthProvider>
          <LanguageProvider>
            <div className="flex min-h-screen min-w-full flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import "./globals.css";
import Footer from "@/components/layout/footer";
