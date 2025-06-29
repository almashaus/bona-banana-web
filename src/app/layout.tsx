import type React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/globals.css";
import Header from "@/src/components/layout/header";
import Footer from "@/src/components/layout/footer";
import { Toaster } from "@/src/components/ui/toaster";
import { AuthProvider } from "@/src/features/auth/auth-provider";
import { LanguageProvider } from "@/src/components/i18n/language-provider";

const DINNextLT = localFont({
  src: [
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-UltraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-custom",
});

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
          <LanguageProvider>
            <div className="flex flex-col min-h-screen min-w-full">
              <Header />
              <main className="flex-grow pt-16">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
