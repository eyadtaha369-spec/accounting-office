"use server";
import { requireAdmin } from "@/lib/auth";
import { batch, insert, remove, update, type Row } from "@/lib/sheets";
import { refreshSite } from "@/lib/site-server";
import { PAGE_ICONS, SETTING_FIELDS, type IconName } from "@/lib/site";
import { isServiceKey } from "@/lib/services";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
const yn = (v: unknown) => (v === false || v === "no" ? "no" : "yes");

type PageInput = { title_ar: string; title_en?: string; desc_ar?: string; desc_en?: string; icon: string; sort?: string; is_active?: boolean | string; show_home?: boolean | string };

function cleanPage(p: PageInput) {
  const title_ar = str(p.title_ar, 120);
  if (!title_ar) return null;
  return {
    title_ar,
    title_en: str(p.title_en, 120),
    desc_ar: str(p.desc_ar, 1500),
    desc_en: str(p.desc_en, 1500),
    icon: PAGE_ICONS.includes(p.icon as IconName) ? p.icon : "file",
    is_active: yn(p.is_active),
    show_home: yn(p.show_home),
  };
}

/** إضافة صفحة/خدمة — id قصير ثابت يُستخدم في Users.services والأرشيف */
export async function addSitePage(input: PageInput & { id?: string }) {
  await requireAdmin();
  const d = cleanPage(input);
  if (!d) return { ok: false as const, error: "required" };
  const id = input.id && isServiceKey(input.id) ? input.id : `p-${crypto.randomUUID().slice(0, 8)}`;
  const row = await insert("site_pages", { id, ...d, sort: str(input.sort, 6) || String(Date.now() % 100000) });
  refreshSite();
  return { ok: true as const, row };
}

export async function updateSitePage(id: string, patch: Partial<PageInput>) {
  await requireAdmin();
  const p: Row = {};
  if (patch.title_ar !== undefined) { const v = str(patch.title_ar, 120); if (!v) return { ok: false as const, error: "required" }; p.title_ar = v; }
  if (patch.title_en !== undefined) p.title_en = str(patch.title_en, 120);
  if (patch.desc_ar !== undefined) p.desc_ar = str(patch.desc_ar, 1500);
  if (patch.desc_en !== undefined) p.desc_en = str(patch.desc_en, 1500);
  if (patch.icon !== undefined) p.icon = PAGE_ICONS.includes(patch.icon as IconName) ? patch.icon : "file";
  if (patch.is_active !== undefined) p.is_active = yn(patch.is_active);
  if (patch.show_home !== undefined) p.show_home = yn(patch.show_home);
  if (patch.sort !== undefined) p.sort = str(patch.sort, 6);
  const row = await update("site_pages", id, p);
  refreshSite();
  return { ok: true as const, row };
}

/** حفظ ترتيب الصفحات دفعة واحدة */
export async function reorderSitePages(ids: string[]) {
  await requireAdmin();
  const rows = (await batch(ids.slice(0, 200).map((id, i) => ({ op: "update" as const, table: "site_pages" as const, id, patch: { sort: String((i + 1) * 10) } })))) as Row[];
  refreshSite();
  return { ok: true as const, rows };
}

export async function deleteSitePage(id: string) {
  await requireAdmin();
  await remove("site_pages", id);
  refreshSite();
  return { ok: true as const };
}

/** حفظ إعدادات الموقع (upsert لكل إعداد) */
export async function saveSiteSettings(values: Record<string, { ar?: string; en?: string }>) {
  await requireAdmin();
  const ops = SETTING_FIELDS.filter((f) => values[f.id]).map((f) => ({
    op: "upsert" as const,
    table: "site_settings" as const,
    row: { id: f.id, value_ar: str(values[f.id].ar, 2000), value_en: f.bi ? str(values[f.id].en, 2000) : "" },
  }));
  const rows = (await batch(ops)) as Row[];
  refreshSite();
  return { ok: true as const, rows };
}
