import "server-only";
import { cookies } from "next/headers";
import { dictionaries, LOCALE_COOKIE, type Locale } from "./i18n";
import { applySite, getSite } from "./site-server";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ar";
}

/** القاموس مدموجاً بإعدادات الموقع من Google Sheets (من الكاش) */
export async function getDict() {
  const locale = await getLocale();
  const site = await getSite();
  return { locale, t: applySite(dictionaries[locale], site, locale), site };
}
