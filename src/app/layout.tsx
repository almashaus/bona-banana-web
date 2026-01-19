import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/globals.css";
import "../styles/embla.css";
import Header from "@/src/components/layout/header";
import Footer from "@/src/components/layout/footer";
import { Toaster } from "@/src/components/ui/toaster";
import { AuthProvider } from "@/src/features/auth/auth-provider";
import { MySWRProvider } from "@/src/features/context/swr-provider";
import { DINNextLT } from "../styles/fonts";
import { getServerSession } from "../features/auth/auth-server";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "../components/theme/theme-provider";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Bona Banana",
  description: "Book tickets for your favorite game event",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome", url: "/android-chrome-512x512.png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="stylesheet" href="/css/riyal.css" />
      </head>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      <body className={DINNextLT.className}>
        {/* <ThemeProvider attribute="class" defaultTheme="light"> */}
        <AuthProvider>
          <MySWRProvider>
            <NextIntlClientProvider messages={messages}>
              <Analytics />
              <SpeedInsights />
              <div className="flex flex-col min-h-screen w-screen">
                <Header initialUser={session.user} />
                <main className="flex-grow pt-16">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </NextIntlClientProvider>
          </MySWRProvider>
        </AuthProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
