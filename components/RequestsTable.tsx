import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { fmtDate } from "@/lib/format";
import { requestLabel } from "@/lib/labels";
import type { Dict, Locale, Status } from "@/lib/i18n";

export type AdminRequestRow = {
  id: string;
  reference_no: string | number;
  request_type: string;
  sub_type: string | null;
  status: string;
  created_at: string;
  completed_at?: string | null;
  admin_message?: string | null;
  client?: { id: string; full_name: string; phone: string } | null;
};

export default function RequestsTable({ rows, t, locale, showClient = true, showCompleted = false, empty }: {
  rows: AdminRequestRow[];
  t: Dict;
  locale: Locale;
  showClient?: boolean;
  showCompleted?: boolean;
  empty: string;
}) {
  if (!rows.length) return <p className="p-10 text-center text-sm text-slate-500">{empty}</p>;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t.dash.refNo}</th>
              {showClient && <th className="px-4 py-3 text-start font-medium">{t.admin.client}</th>}
              <th className="px-4 py-3 text-start font-medium">{t.dash.service}</th>
              <th className="px-4 py-3 text-start font-medium">{t.dash.date}</th>
              {showCompleted && <th className="px-4 py-3 text-start font-medium">{t.admin.completedAt}</th>}
              <th className="px-4 py-3 text-start font-medium">{t.dash.statusCol}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="ltr-num px-4 py-3.5 font-mono text-slate-500">#{r.reference_no}</td>
                {showClient && (
                  <td className="px-4 py-3.5">
                    {r.client ? (
                      <Link href={`/admin/clients/${r.client.id}`} className="font-medium text-navy-800 hover:text-gold-600">{r.client.full_name}</Link>
                    ) : "—"}
                    <div className="ltr-num text-xs text-slate-400">{r.client?.phone}</div>
                  </td>
                )}
                <td className="px-4 py-3.5 text-slate-700">{requestLabel(t, r.request_type, r.sub_type)}</td>
                <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{fmtDate(r.created_at, locale)}</td>
                {showCompleted && <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{fmtDate(r.completed_at, locale)}</td>}
                <td className="px-4 py-3.5"><StatusBadge status={r.status as Status} label={t.status[r.status as Status]} /></td>
                <td className="px-4 py-3.5 text-end">
                  <Link href={`/admin/requests/${r.id}`} className="btn-outline px-3 py-1.5 text-xs">{t.admin.manage}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/requests/${r.id}`} className="block p-4 active:bg-slate-50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {showClient && <div className="font-semibold text-navy-900">{r.client?.full_name}</div>}
                  <div className="text-sm text-slate-700">{requestLabel(t, r.request_type, r.sub_type)}</div>
                </div>
                <StatusBadge status={r.status as Status} label={t.status[r.status as Status]} />
              </div>
              <div className="mt-2 flex gap-3 text-xs text-slate-500">
                <span className="ltr-num font-mono">#{r.reference_no}</span>
                <span>{fmtDate(r.created_at, locale)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
