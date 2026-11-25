"use client";
import Link from "next/link";
import { useI18n } from "@/components/store/I18n";
import { Panel } from "@/components/ops/Panel";
import { daysUntil, upcomingDeadlines, type Deadline } from "@/lib/tax";
import { fmtDate } from "@/lib/format";
import type { R } from "@/lib/store-types";

/** رادار الأدمن: المواعيد القريبة + العملاء الذين لم يُسجَّل لهم إقرار لنفس الفترة */
export default function TaxRadar({ users, records }: { users: R[]; records: R[] }) {
  const { t, locale } = useI18n();
  const clients = users.filter((u) => u.role === "client" && (u.file_status || "active") !== "closed");
  const deadlines = upcomingDeadlines(new Date(), 45);

  function relevant(d: Deadline) {
    if (d.key === "income_individual") return clients.filter((c) => c.client_type === "individual");
    if (d.key === "income_company") return clients.filter((c) => c.client_type !== "individual");
    // باقي الإقرارات: العملاء الذين لديهم سجلات سابقة لنفس الخدمة
    const ids = new Set(records.filter((r) => r.service === d.service).map((r) => r.client_id));
    return clients.filter((c) => ids.has(c.id));
  }
  const covered = (d: Deadline, clientId: string) =>
    records.some((r) => r.client_id === clientId && r.service === d.service && (r.due_date || "").slice(0, 7) === d.due.slice(0, 7));

  // دمج نموذج 41 و4 لنفس التاريخ يبقيان منفصلين لأن الخدمة مختلفة
  const rows = deadlines.slice(0, 6).map((d) => {
    const rel = relevant(d);
    return { d, days: daysUntil(d.due), missing: rel.filter((c) => !covered(d, c.id)), total: rel.length };
  });

  return (
    <Panel title={`🎯 ${t.portal.radarTitle}`} hint={t.portal.radarHint}>
      {rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">{t.portal.noDeadlines}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map(({ d, days, missing, total }) => (
            <li key={d.key + d.due} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-navy-900">{t.portal.deadlines[d.key]}</div>
                  <div className="text-xs text-slate-500">{t.portal.period} {d.period} · {fmtDate(d.due, locale)}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${days <= 7 ? "bg-red-50 text-red-700" : days <= 20 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                  {days === 0 ? t.portal.dueToday : `${days} ${t.portal.daysLeft}`}
                </span>
              </div>
              {total > 0 && (
                <div className="mt-2">
                  {missing.length === 0 ? (
                    <p className="text-xs font-semibold text-emerald-700">{t.portal.allCovered}</p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-red-600">
                        {missing.length}/{total} {t.portal.missing}:
                      </span>
                      {missing.slice(0, 8).map((c) => (
                        <Link key={c.id} href={`/admin/records?service=${d.service}&client=${c.id}`} className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700 ring-1 ring-red-100 hover:bg-red-100">
                          {c.full_name}
                        </Link>
                      ))}
                      {missing.length > 8 && <span className="text-xs text-slate-400">+{missing.length - 8}</span>}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
