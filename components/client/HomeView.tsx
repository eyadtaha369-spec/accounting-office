"use client";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Icon } from "@/components/Icons";
import { useClient } from "@/components/store/stores";
import { useI18n, useMe } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { fmtDate } from "@/lib/format";
import { requestLabel } from "@/lib/labels";
import { desc, isTmp } from "@/lib/view";
import type { Status } from "@/lib/i18n";

export default function ClientHome() {
  const s = useClient();
  const me = useMe();
  const { t, locale } = useI18n();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{t.dash.welcome}</p>
          <h1 className="text-2xl font-bold text-navy-900">{me.name}</h1>
        </div>
        <Link href="/dashboard/new" className="btn-gold">
          <Icon name="plus" className="h-4 w-4" />
          {t.dash.newRequest}
        </Link>
      </div>
      <Guard s={s}>
        {(d) => {
          const list = [...d.Requests].sort(desc());
          const count = (f: (st: string) => boolean) => list.filter((r) => f(r.status)).length;
          const ref = (r: (typeof list)[number]) => (isTmp(r.id) ? "…" : `#${r.reference_no}`);
          return (
            <>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <Stat label={t.dash.openCount} value={count((st) => st === "pending_review" || st === "in_progress")} tone="text-blue-700" />
                <Stat label={t.dash.needsCount} value={count((st) => st === "needs_documents")} tone="text-orange-600" />
                <Stat label={t.dash.doneCount} value={count((st) => st === "completed")} tone="text-emerald-700" />
              </div>
              <section className="card overflow-hidden">
                <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-navy-900">{t.dash.overview}</h2></div>
                {list.length === 0 ? (
                  <p className="p-10 text-center text-sm text-slate-500">{t.dash.noRequests}</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {list.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={isTmp(r.id) ? "#" : `/dashboard/requests/${r.id}`}
                          className={`flex flex-col gap-2 p-4 hover:bg-page sm:flex-row sm:items-center sm:justify-between ${isTmp(r.id) ? "pointer-events-none opacity-70" : ""}`}
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800">{requestLabel(t, r.request_type, r.sub_type)}</div>
                            <div className="mt-1 flex gap-3 text-xs text-slate-500">
                              <span className="ltr-num font-mono">{ref(r)}</span>
                              <span>{fmtDate(r.created_at, locale)}</span>
                            </div>
                            {r.status === "needs_documents" && r.admin_message && (
                              <p className="mt-2 rounded-lg bg-orange-50 p-2 text-xs text-orange-800">{r.admin_message}</p>
                            )}
                          </div>
                          <StatusBadge status={r.status as Status} label={t.status[r.status as Status]} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          );
        }}
      </Guard>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className={`text-2xl font-bold sm:text-3xl ${tone}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</div>
    </div>
  );
}
