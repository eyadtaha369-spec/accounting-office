import "server-only";
import { cookies } from "next/headers";
import { dictionaries, LOCALE_COOKIE, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ar";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
