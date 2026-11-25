"use client";
import { Icon } from "@/components/Icons";
import { SERVICE_ICON } from "@/components/portal/serviceIcons";
import { CLIENT_SERVICES, type ClientService } from "@/lib/services";
import type { Dict } from "@/lib/i18n";

/** مربعات اختيار الخدمات (تُستخدم في إضافة عميل وفي ملف العميل) */
export default function ServiceChecks({ t, value, onChange, name }: { t: Dict; value: string[]; onChange: (v: string[]) => void; name?: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {CLIENT_SERVICES.map((k: ClientService) => {
        const on = value.includes(k);
        return (
          <label
            key={k}
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ring-1 transition ${on ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-700 ring-slate-200 hover:ring-gold-400"}`}
          >
            <input
              type="checkbox"
              name={name}
              value={k}
              checked={on}
              onChange={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}
              className="h-4 w-4 accent-[#c7a45b]"
            />
            <Icon name={SERVICE_ICON[k]} className={`h-4 w-4 ${on ? "text-gold-300" : "text-gold-600"}`} />
            <span className="font-medium">{t.arch.svc[k]}</span>
          </label>
        );
      })}
    </div>
  );
}
