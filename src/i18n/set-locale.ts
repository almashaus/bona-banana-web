"use server";

import { cookies } from "next/headers";

const LOCALES = ["en", "ar"] as const;
type Locale = (typeof LOCALES)[number];

export async function setLocale(locale: Locale) {
  (await cookies()).set("locale", locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    // secure: true,
    // maxAge: 60 * 60 * 24 * 365
  });
}
