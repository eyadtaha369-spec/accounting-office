// إعدادات الموقع والصفحات الديناميكية — مشترك بين الخادم والمتصفح
import type { icons } from "@/components/Icons";
import type { Locale } from "@/lib/i18n";

export type IconName = keyof typeof icons;
export type Row = Record<string, string>;

/** الأيقونات المتاحة للاختيار عند إضافة صفحة/خدمة */
export const PAGE_ICONS: IconName[] = [
  "percent", "landmark", "receipt", "users", "shield", "report", "search", "building", "calculator", "scale",
  "home", "pie", "coins", "gavel", "handshake", "clipboard", "briefcase", "bulb", "globe", "truck",
  "factory", "health", "education", "wallet", "book", "file", "archive", "chip",
];

type Seed = { id: string; icon: IconName; ar: [string, string]; en: [string, string] };
/** الصفحات الافتراضية — تُكتب في الشيت مرة واحدة فقط عند أول تشغيل */
export const DEFAULT_PAGES: Seed[] = [
  { id: "vat", icon: "percent", ar: ["ضريبة القيمة المضافة", "التسجيل في ضريبة القيمة المضافة\nإعداد وتقديم الإقرارات الشهرية\nالرد على المطالبات وتسوية الأرصدة"], en: ["Value Added Tax", "VAT registration\nMonthly return preparation and filing\nHandling claims and balance settlements"] },
  { id: "income", icon: "landmark", ar: ["ضريبة الدخل والإقرارات السنوية", "إقرارات الأشخاص الطبيعيين والاعتباريين\nإعداد الحسابات الختامية الضريبية\nحضور الفحص الضريبي والطعون واللجان"], en: ["Income Tax & Annual Returns", "Individual and corporate returns\nTax closing accounts\nTax inspections, appeals and committees"] },
  { id: "einvoice", icon: "receipt", ar: ["الفاتورة والإيصال الإلكتروني", "التسجيل والتفعيل على منظومة الفاتورة الإلكترونية\nمنظومة الإيصال الإلكتروني (E-Receipt)\nالدعم الفني وحل مشكلات الربط"], en: ["E-Invoice & E-Receipt", "Registration and activation on the e-invoicing system\nE-Receipt system\nTechnical support and integration issues"] },
  { id: "payroll", icon: "users", ar: ["ضريبة المرتبات وكسب العمل", "ضريبة المرتبات والنماذج الربع سنوية\nالتسوية السنوية للمرتبات\nمنظومة توحيد أسس احتساب ضريبة الأجور"], en: ["Payroll Tax", "Payroll tax and quarterly forms\nAnnual payroll settlement\nUnified wage tax system"] },
  { id: "insurance", icon: "shield", ar: ["التأمينات الاجتماعية", "فتح الملفات التأمينية للمنشآت\nتسجيل العاملين وتسوية المستحقات\nاستخراج الشهادات والمخالصات"], en: ["Social Insurance", "Opening establishment insurance files\nRegistering employees and settling dues\nCertificates and clearances"] },
  { id: "financials", icon: "report", ar: ["الميزانيات والقوائم المالية", "إعداد القوائم المالية السنوية\nميزانيات معتمدة للبنوك والمناقصات\nالتقارير المالية الدورية"], en: ["Financial Statements", "Annual financial statements\nCertified balance sheets for banks and tenders\nPeriodic financial reports"] },
  { id: "audit", icon: "search", ar: ["المراجعة والتدقيق", "مراجعة القوائم المالية وتقرير مراقب الحسابات\nالمراجعة الداخلية وأنظمة الرقابة\nمراجعة الإقرارات قبل تقديمها"], en: ["Audit", "Financial statement audit and auditor's report\nInternal audit and controls\nReviewing returns before filing"] },
  { id: "formation", icon: "building", ar: ["تأسيس الشركات وتعديل العقود", "تأسيس كافة أنواع الشركات والمنشآت الفردية\nاستخراج السجل التجاري والبطاقة الضريبية\nتعديل عقود الشركات وزيادة رأس المال"], en: ["Company Formation & Amendments", "Forming all company types and sole proprietorships\nCommercial register and tax card\nContract amendments and capital increases"] },
  { id: "feasibility", icon: "bulb", ar: ["دراسات الجدوى والاستشارات", "دراسات الجدوى الاقتصادية للمشروعات\nالاستشارات المالية والضريبية\nتقييم الشركات والتخطيط الضريبي"], en: ["Feasibility Studies & Advisory", "Economic feasibility studies\nFinancial and tax advisory\nBusiness valuation and tax planning"] },
];

/** حقول إعدادات الموقع — bi: نص بلغتين، وإلا قيمة واحدة */
export const SETTING_FIELDS = [
  { id: "office_name", bi: true, group: "hero" },
  { id: "office_tagline", bi: true, group: "hero" },
  { id: "hero_title", bi: true, group: "hero" },
  { id: "hero_accent", bi: true, group: "hero" },
  { id: "hero_subtitle", bi: true, group: "hero", long: true },
  { id: "about", bi: true, group: "about", long: true },
  { id: "phones", bi: false, group: "contact", ltr: true },
  { id: "whatsapp", bi: false, group: "contact", ltr: true },
  { id: "email", bi: false, group: "contact", ltr: true },
  { id: "address", bi: true, group: "contact", long: true },
  { id: "hours", bi: true, group: "contact", long: true },
  { id: "announcement", bi: true, group: "notice", long: true },
] as const;
export type SettingId = (typeof SETTING_FIELDS)[number]["id"];

export const isOn = (v: string | undefined) => v !== "no";

/** قيمة إعداد باللغة المطلوبة (الإنجليزية تعود للعربية إن كانت فارغة) */
export function settingValue(rows: Row[], id: SettingId, locale: Locale) {
  const r = rows.find((x) => x.id === id);
  if (!r) return "";
  return ((locale === "en" ? r.value_en : "") || r.value_ar || "").trim();
}

export const sortPages = (rows: Row[]) =>
  [...rows].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0) || a.created_at?.localeCompare(b.created_at ?? "") || 0);

export const pageTitle = (p: Row | undefined, locale: Locale) => (p ? (locale === "en" ? p.title_en || p.title_ar : p.title_ar || p.title_en) : "");
export const pageDesc = (p: Row, locale: Locale) => (locale === "en" ? p.desc_en || p.desc_ar : p.desc_ar || p.desc_en) || "";
export const pageIcon = (p: Row | undefined): IconName => ((p && PAGE_ICONS.includes(p.icon as IconName) ? p.icon : "file") as IconName);

/** رابط واتساب من رقم (يضيف كود مصر للأرقام المحلية) */
export function waNumber(v: string) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("01") && d.length === 11) d = "2" + d;
  return d;
}
