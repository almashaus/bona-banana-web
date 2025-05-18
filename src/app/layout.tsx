import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import Header from "@/src/components/layout/header";
import Footer from "@/src/components/layout/footer";
import { Toaster } from "@/src/components/ui/toaster";
import { AuthProvider } from "@/src/features/auth/auth-provider";
import { LanguageProvider } from "@/src/components/i18n/language-provider";

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
