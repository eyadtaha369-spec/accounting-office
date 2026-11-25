"use client";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { saveSiteSettings } from "@/app/admin/site-actions";
import { SETTING_FIELDS, type Row } from "@/lib/site";
import { nowIso } from "@/lib/view";

type Vals = Record<string, { ar: string; en: string }>;
const GROUPS = ["hero", "about", "contact", "notice"] as const;

/** بيانات المكتب والصفحة الرئيسية — الحقول الفارغة تعود للنص الافتراضي */
export default function GeneralSettings() {
  const s = useAdmin();
  const { t } = useI18n();
  const rows = s.data?.SiteSettings ?? [];
  const init = (): Vals => Object.fromEntries(SETTING_FIELDS.map((f) => { const r = rows.find((x) => x.id === f.id); return [f.id, { ar: r?.value_ar ?? "", en: r?.value_en ?? "" }]; }));
  const [v, setV] = useState<Vals>(init);
  const [msg, setMsg] = useState("");
  const set = (id: string, lang: "ar" | "en", val: string) => { setMsg(""); setV((x) => ({ ...x, [id]: { ...x[id], [lang]: val } })); };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Row[] = SETTING_FIELDS.map((f) => ({ id: f.id, value_ar: v[f.id].ar.trim(), value_en: f.bi ? v[f.id].en.trim() : "", updated_at: nowIso() }));
    setMsg(t.site.saved);
    void s.mutate({
      apply: (d) => ({ ...d, SiteSettings: [...d.SiteSettings.filter((r) => !next.some((n) => n.id === r.id)), ...next] }),
      run: () => saveSiteSettings(v),
      error: t.sync.saveFailed,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6 p-5">
      {GROUPS.map((g) => (
        <fieldset key={g} className="rounded-2xl bg-page/60 p-4 ring-1 ring-slate-200 sm:p-5">
          <legend className="px-1 text-sm font-bold text-gold-600">{g === "notice" ? "📢 " : ""}{t.site.groups[g]}</legend>
          <div className="mt-2 space-y-4">
            {SETTING_FIELDS.filter((f) => f.group === g).map((f) => {
              const long = "long" in f && f.long;
              const ltr = "ltr" in f && f.ltr;
              const Field = (lang: "ar" | "en") => {
                const common = {
                  value: v[f.id][lang],
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(f.id, lang, e.target.value),
                  className: "input",
                  dir: lang === "en" || ltr ? ("ltr" as const) : undefined,
                  placeholder: f.id === "announcement" && lang === "ar" ? t.site.announcementPh : undefined,
                  maxLength: 2000,
                  "aria-label": `${t.site.fields[f.id]} ${lang}`,
                };
                return long || f.id === "phones" ? <textarea rows={f.id === "about" || f.id === "hero_subtitle" ? 3 : 2} {...common} /> : <input {...common} />;
              };
              return (
                <div key={f.id}>
                  <label className="label">{t.site.fields[f.id]}</label>
                  {f.bi ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div><span className="mb-1 block text-[11px] text-slate-400">{t.site.arabic}</span>{Field("ar")}</div>
                      <div><span className="mb-1 block text-[11px] text-slate-400">{t.site.english}</span>{Field("en")}</div>
                    </div>
                  ) : (
                    Field("ar")
                  )}
                </div>
              );
            })}
            {g === "notice" && v.announcement.ar.trim() && (
              <div className="rounded-xl bg-gold-500 px-4 py-2 text-center text-sm font-semibold text-navy-950">📢 {v.announcement.ar}</div>
            )}
          </div>
        </fieldset>
      ))}
      <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
        <button className="btn-navy"><Icon name="check" className="h-4 w-4" /> {t.site.saveSettings}</button>
        <a href="/" target="_blank" rel="noopener" className="btn-outline"><Icon name="external" className="h-4 w-4" /> {t.site.preview}</a>
        {msg && <span className="text-sm text-emerald-700">✓ {msg}</span>}
      </div>
    </form>
  );
}
