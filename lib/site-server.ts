import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { batch, type Row } from "@/lib/sheets";
import { DEFAULT_PAGES, SETTING_FIELDS, settingValue, sortPages } from "@/lib/site";
import type { Dict, Locale } from "@/lib/i18n";

export const SITE_TAG = "site";
export type SiteData = { pages: Row[]; settings: Row[] };

const defaults = (): SiteData => ({
  pages: DEFAULT_PAGES.map((p, i) => ({
    id: p.id, title_ar: p.ar[0], desc_ar: p.ar[1], title_en: p.en[0], desc_en: p.en[1], icon: p.icon,
    sort: String((i + 1) * 10), is_active: "yes", show_home: "yes", created_at: "", updated_at: "",
  })),
  settings: [],
});

/** قراءة الصفحات والإعدادات من الشيت (مع تهيئة الصفحات الافتراضية أول مرة) */
async function readSite(): Promise<SiteData> {
  const [pages, settings] = (await batch([
    { op: "select", table: "site_pages" },
    { op: "select", table: "site_settings" },
  ])) as [Row[], Row[]];
  if (!settings.some((s) => s.id === "_pages_seeded")) {
    const d = defaults();
    const ops = [
      ...(pages.length ? [] : d.pages.map((row) => ({ op: "upsert" as const, table: "site_pages" as const, row }))),
      { op: "upsert" as const, table: "site_settings" as const, row: { id: "_pages_seeded", value_ar: "yes", value_en: "" } },
    ];
    const res = (await batch(ops)) as Row[];
    return { pages: pages.length ? pages : res.slice(0, -1), settings: [...settings, res[res.length - 1]] };
  }
  return { pages, settings };
}

const cachedSite = unstable_cache(readSite, ["site-data-v1"], { tags: [SITE_TAG], revalidate: 600 });

/** بيانات الموقع من الكاش (يُحدَّث فوراً عند أي حفظ من لوحة الإدارة) — لا يكسر الموقع أبداً */
export async function getSite(): Promise<SiteData> {
  try {
    return await cachedSite();
  } catch {
    return defaults(); // مثلاً قبل تحديث Code.gs
  }
}

export const refreshSite = () => revalidateTag(SITE_TAG);

/** دمج إعدادات الموقع داخل القاموس، فتتحدث كل الصفحات (الرئيسية، الدخول، البوابات) تلقائياً */
export function applySite(base: Dict, site: SiteData, locale: Locale): Dict {
  const t = structuredClone(base);
  const v = (id: (typeof SETTING_FIELDS)[number]["id"]) => settingValue(site.settings, id, locale);
  const name = v("office_name");
  if (name) { t.brand = name; t.brandShort = name; }
  if (v("office_tagline")) t.brandTag = v("office_tagline");
  if (v("hero_title")) { t.hero.title = v("hero_title"); t.hero.titleAccent = v("hero_accent"); }
  else if (v("hero_accent")) t.hero.titleAccent = v("hero_accent");
  if (v("hero_subtitle")) t.hero.subtitle = v("hero_subtitle");
  if (v("about")) t.footer.about = v("about");
  if (v("address")) t.footer.address = v("address");
  if (v("email")) t.footer.email = v("email");
  const phones = v("phones").split(/[\n,،]+/).map((x) => x.trim()).filter(Boolean);
  if (phones.length) { t.footer.phone = phones[0]; t.contact.phones = phones; }
  t.contact.whatsapp = v("whatsapp") || t.footer.phone;
  const hours = v("hours").split("\n").map((x) => x.trim()).filter(Boolean);
  if (hours.length) { t.footer.hoursValue = hours[0]; t.footer.hoursValue2 = hours.slice(1).join(" · "); }
  t.contact.announcement = v("announcement");
  return t;
}

export const activePages = (site: SiteData) => sortPages(site.pages.filter((p) => p.is_active !== "no"));
