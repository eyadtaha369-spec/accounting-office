/** الخدمات الافتراضية (تُستخدم لتهيئة شيت site_pages أول مرة) — بعدها القائمة ديناميكية بالكامل */
export const CLIENT_SERVICES = ["vat", "income", "einvoice", "payroll", "insurance", "financials", "audit", "formation"] as const;
export type ClientService = string;

const KEY = /^[a-z0-9][a-z0-9_-]{0,39}$/i;
export const isServiceKey = (k: string) => KEY.test(k) && k !== "general";

export function parseServices(v: string | undefined | null): string[] {
  return [...new Set(String(v ?? "").split(",").map((x) => x.trim()).filter(isServiceKey))];
}

export const serializeServices = (list: string[]) => [...new Set(list.filter(isServiceKey))].join(",");
