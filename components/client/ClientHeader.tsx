"use client";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/components/store/I18n";
import { officeWhatsApp } from "@/lib/contact";
import { parseServices } from "@/lib/services";
import { SERVICE_ICON } from "@/components/portal/serviceIcons";
import type { R } from "@/lib/store-types";

/** رأس بوابة العميل: الاسم ورقم التسجيل الضريبي والبيانات المسجلة (قراءة فقط) */
export default function ClientHeader({ me, full = false }: { me: R; full?: boolean }) {
  const { t } = useI18n();
  const types = (t.clientTypes ?? {}) as Record<string, string>;
  const fields: [string, string][] = [
    [t.auth.taxNumber.replace(/\s*\(.*\)/, ""), me.tax_registration_number],
    [t.auth.companyName, me.company_name],
    [t.auth.clientType.split("/")[0].trim(), types[me.client_type] ?? me.client_type],
    [t.auth.taxOffice, me.tax_office],
    ...(full
      ? ([
          [t.auth.email, me.email],
          [t.auth.phone.replace(/\s*\(.*\)/, ""), me.phone],
          [t.auth.nationalId.replace(/\s*\(.*\)/, ""), me.national_id],
          [t.auth.address, me.address],
        ] as [string, string][])
      : []),
  ];
  const services = parseServices(me.services);
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-white shadow-lg">
      <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold-500/15 text-2xl font-bold text-gold-300 ring-1 ring-gold-400/40">
          {(me.full_name || "?").trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/60">{t.dash.welcome}</p>
          <h1 className="truncate text-xl font-bold sm:text-2xl">{me.full_name}</h1>
        </div>
        <a href={officeWhatsApp(t.footer.phone)} target="_blank" rel="noopener noreferrer" className="btn-gold px-4 py-2 text-sm">
          <Icon name="phone" className="h-4 w-4" /> {t.arch.contactOffice}
        </a>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
        {fields.map(([k, v]) => (
          <div key={k} className="bg-navy-900/60 px-5 py-3">
            <dt className="text-[11px] text-gold-300/90">{k}</dt>
            <dd className="ltr-num mt-0.5 truncate text-sm font-semibold">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      {services.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3">
          {services.map((k) => (
            <Link key={k} href={`/dashboard/services/${k}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-gold-500/25">
              <Icon name={SERVICE_ICON[k]} className="h-3.5 w-3.5 text-gold-300" /> {t.arch.svc[k]}
            </Link>
          ))}
        </div>
      )}
      <p className="flex items-center gap-2 bg-black/20 px-5 py-2 text-[11px] text-white/60">
        <Icon name="lock" className="h-3.5 w-3.5" /> {t.arch.readOnly}
      </p>
    </div>
  );
}
