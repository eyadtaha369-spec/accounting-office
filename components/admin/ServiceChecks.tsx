"use client";
import { Icon } from "@/components/Icons";
import { usePages } from "@/components/store/SitePages";
import type { Dict } from "@/lib/i18n";

/** مربعات اختيار الخدمات — القائمة تأتي من إعدادات الصفحات (site_pages) */
export default function ServiceChecks({ t, value, onChange, name }: { t: Dict; value: string[]; onChange: (v: string[]) => void; name?: string }) {
  const pages = usePages();
  // الصفحات المفعلة + أي خدمة موقوفة ما زالت مختارة لهذا العميل
  const list = pages.all.filter((p) => p.is_active !== "no" || value.includes(p.id));
  if (!list.length) return <p className="text-sm text-slate-500">{t.arch.noServices}</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {list.map((p) => {
        const k = p.id;
        const on = value.includes(k);
        return (
          <label
            key={k}
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ring-1 transition ${on ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-700 ring-slate-200 hover:ring-gold-400"}`}
          >
            <input type="checkbox" name={name} value={k} checked={on} onChange={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])} className="h-4 w-4 accent-[#c7a45b]" />
            <Icon name={pages.icon(k)} className={`h-4 w-4 ${on ? "text-gold-300" : "text-gold-600"}`} />
            <span className="flex-1 font-medium">{pages.label(k)}</span>
            {p.is_active === "no" && <span className="rounded bg-slate-200 px-1.5 text-[10px] text-slate-600">{t.site.inactive}</span>}
          </label>
        );
      })}
    </div>
  );
}
