"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import FileList from "@/components/FileList";
import ManageRequest from "./ManageRequest";
import WaButton from "@/components/portal/WaButton";
import { statusMessage } from "@/lib/wa";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { fmtDate } from "@/lib/format";
import { requestLabel } from "@/lib/labels";
import { asc } from "@/lib/view";
import type { Status } from "@/lib/i18n";

export default function RequestDetailView() {
  const { id } = useParams<{ id: string }>();
  const s = useAdmin();
  const { t, locale } = useI18n();
  return (
    <Guard s={s}>
      {(d) => {
        const r = d.Requests.find((x) => x.id === id);
        if (!r) return <p className="card p-10 text-center text-slate-500">404</p>;
        const c = d.Users.find((u) => u.id === r.client_id);
        const files = d.Files.filter((f) => f.request_id === id).sort(asc()).map((f) => ({ id: f.id, file_name: f.file_name, kind: f.kind, ticket: s.ticket(f.drive_file_id) }));
        const history = d.StatusHistory.filter((h) => h.request_id === id).sort(asc());
        const status = r.status as Status;
        return (
          <div className="space-y-6">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-navy-700">← {t.admin.back}</Link>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="ltr-num font-mono text-xs text-slate-400">#{r.reference_no || "…"}</div>
                      <h1 className="mt-1 text-xl font-bold text-navy-900">{requestLabel(t, r.request_type, r.sub_type)}</h1>
                      <p className="mt-1 text-sm text-slate-500">{fmtDate(r.created_at, locale, true)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={status} label={t.status[status]} />
                      {c && (
                        <WaButton
                          small
                          phone={c.phone}
                          label={t.portal.wa.notify}
                          text={statusMessage({
                            name: c.full_name,
                            service: requestLabel(t, r.request_type, r.sub_type),
                            status,
                            statusLabel: t.status[status],
                            ref: r.reference_no,
                            url: typeof window !== "undefined" ? `${window.location.origin}/dashboard/requests/${r.id}` : "",
                            brand: t.brand,
                            message: r.admin_message,
                          })}
                        />
                      )}
                    </div>
                  </div>
                  {r.description && <p className="mt-5 whitespace-pre-wrap rounded-xl bg-page p-4 text-sm leading-7 text-slate-700">{r.description}</p>}
                </div>
                <div className="card p-5 sm:p-6">
                  <h2 className="mb-4 font-bold text-navy-900">{t.admin.changeStatus}</h2>
                  <ManageRequest key={r.id + r.status} request={r} />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="card p-5">
                    <h2 className="mb-3 font-bold text-navy-900">{t.admin.clientAttachments}</h2>
                    <FileList url={s.url} files={files.filter((f) => f.kind === "client_attachment")} downloadLabel={t.dash.download} />
                  </div>
                  <div className="card p-5">
                    <h2 className="mb-3 font-bold text-navy-900">{t.dash.finalFiles}</h2>
                    <FileList url={s.url} files={files.filter((f) => f.kind === "office_deliverable")} downloadLabel={t.dash.download} />
                  </div>
                </div>
              </div>
              <aside className="space-y-6">
                {c && (
                  <div className="card p-5">
                    <h2 className="mb-4 font-bold text-navy-900">{t.admin.client}</h2>
                    <dl className="space-y-2.5 text-sm">
                      <Row k={t.auth.fullName} v={c.full_name} />
                      {c.company_name && <Row k={t.auth.companyName} v={c.company_name} />}
                      <Row k={t.auth.phone} v={c.phone} ltr />
                      <Row k={t.auth.nationalId} v={c.national_id} ltr />
                      <Row k={t.auth.taxNumber} v={c.tax_registration_number || "—"} ltr />
                    </dl>
                    <Link href={`/admin/clients/${c.id}`} className="btn-navy mt-5 w-full">{t.admin.clientFile}</Link>
                  </div>
                )}
                <div className="card p-5">
                  <h2 className="mb-4 font-bold text-navy-900">{t.dash.timeline}</h2>
                  <ol className="space-y-3">
                    {history.map((h) => (
                      <li key={h.id} className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={h.new_status as Status} label={t.status[h.new_status as Status]} />
                          <span className="text-xs text-slate-400">{fmtDate(h.created_at, locale, true)}</span>
                        </div>
                        {h.message && <p className="mt-1 text-xs text-slate-600">{h.message}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              </aside>
            </div>
          </div>
        );
      }}
    </Guard>
  );
}

function Row({ k, v, ltr }: { k: string; v: string; ltr?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{k}</dt>
      <dd className={`font-medium text-slate-800 ${ltr ? "ltr-num" : ""}`}>{v}</dd>
    </div>
  );
}
