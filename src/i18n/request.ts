import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const LOCALES = ["en", "ar"] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;

  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : "ar";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
