import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import AutoRefresh from "@/components/AutoRefresh";
import { Icon } from "@/components/Icons";
import { requireLogin } from "@/lib/auth";
import { clientRequests } from "@/lib/db";
import { getDict } from "@/lib/locale";
import { fmtDate } from "@/lib/format";
import { requestLabel } from "@/lib/labels";
import type { Status } from "@/lib/i18n";

export default async function ClientHome({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const s = await requireLogin();
  const { t, locale } = await getDict();
  const sp = await searchParams;

  const list = await clientRequests(s.uid);
  const count = (f: (st: Status) => boolean) => list.filter((r) => f(r.status)).length;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{t.dash.welcome}</p>
          <h1 className="text-2xl font-bold text-navy-900">{s.name}</h1>
        </div>
        <Link href="/dashboard/new" className="btn-gold">
          <Icon name="plus" className="h-4 w-4" />
          {t.dash.newRequest}
        </Link>
      </div>

      {sp.submitted && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">{t.dash.submitted}</div>}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label={t.dash.openCount} value={count((st) => st === "pending_review" || st === "in_progress")} tone="text-blue-700" />
        <Stat label={t.dash.needsCount} value={count((st) => st === "needs_documents")} tone="text-orange-600" />
        <Stat label={t.dash.doneCount} value={count((st) => st === "completed")} tone="text-emerald-700" />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-navy-900">{t.dash.overview}</h2>
        </div>
        {list.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">{t.dash.noRequests}</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-slate-50 text-start text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-start font-medium">{t.dash.refNo}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.dash.service}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.dash.date}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.dash.statusCol}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="ltr-num px-5 py-4 font-mono text-slate-500">#{r.reference_no}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{requestLabel(t, r.request_type, r.sub_type)}</div>
                      {r.status === "needs_documents" && r.admin_message && (
                        <div className="mt-1 line-clamp-1 text-xs text-orange-700">{r.admin_message}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{fmtDate(r.created_at, locale)}</td>
                    <td className="px-5 py-4"><StatusBadge status={r.status as Status} label={t.status[r.status as Status]} /></td>
                    <td className="px-5 py-4 text-end">
                      <Link href={`/dashboard/requests/${r.id}`} className="font-semibold text-navy-700 hover:text-gold-600">{t.dash.details}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {list.map((r) => (
                <li key={r.id}>
                  <Link href={`/dashboard/requests/${r.id}`} className="block p-4 active:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-slate-800">{requestLabel(t, r.request_type, r.sub_type)}</div>
                      <StatusBadge status={r.status as Status} label={t.status[r.status as Status]} />
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <span className="ltr-num font-mono">#{r.reference_no}</span>
                      <span>{fmtDate(r.created_at, locale)}</span>
                    </div>
                    {r.status === "needs_documents" && r.admin_message && (
                      <p className="mt-2 rounded-lg bg-orange-50 p-2 text-xs text-orange-800">{r.admin_message}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
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
