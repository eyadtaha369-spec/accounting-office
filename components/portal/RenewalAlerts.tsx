"use client";
import Link from "next/link";
import { useI18n } from "@/components/store/I18n";
import { Panel } from "@/components/ops/Panel";
import WaButton from "./WaButton";
import { daysUntil } from "@/lib/tax";
import { fmtDate } from "@/lib/format";
import { renewalMessage } from "@/lib/wa";
import type { R } from "@/lib/store-types";

/** السجلات التجارية والبطاقات الضريبية التي تنتهي خلال 60 يوماً أو انتهت */
export default function RenewalAlerts({ users }: { users: R[] }) {
  const { t, locale } = useI18n();
  const items = users
    .filter((u) => u.role === "client")
    .flatMap((u) =>
      [
        { doc: t.portal.cr, date: u.cr_expiry },
        { doc: t.portal.taxCard, date: u.tax_card_expiry },
      ]
        .filter((x) => x.date)
        .map((x) => ({ u, ...x, days: daysUntil(x.date) }))
    )
    .filter((x) => x.days <= 60)
    .sort((a, b) => a.days - b.days);

  return (
    <Panel title={`🔔 ${t.portal.renewTitle}`} hint={t.portal.renewHint}>
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm text-emerald-700">{t.portal.noRenewals}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((x) => (
            <li key={x.u.id + x.doc} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/clients/${x.u.id}`} className="font-semibold text-navy-900 hover:text-gold-600">{x.u.full_name}</Link>
                <div className="text-xs text-slate-500">{x.doc} · {fmtDate(x.date, locale)}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${x.days < 0 ? "bg-red-600 text-white" : x.days <= 14 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                {x.days < 0 ? t.portal.expired : `${t.portal.expiresIn} ${x.days} ${t.portal.days}`}
              </span>
              <WaButton small phone={x.u.phone} label={t.portal.wa.remind} text={renewalMessage({ name: x.u.full_name, doc: x.doc, date: x.date, expired: x.days < 0, brand: t.brand })} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
