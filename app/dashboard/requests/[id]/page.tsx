import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import FileList from "@/components/FileList";
import AutoRefresh from "@/components/AutoRefresh";
import UploadMore from "./UploadMore";
import { requireLogin } from "@/lib/auth";
import { requestBundle } from "@/lib/db";
import { getDict } from "@/lib/locale";
import { fmtDate } from "@/lib/format";
import { requestLabel } from "@/lib/labels";
import { downloadTicket } from "@/lib/tickets";

export default async function RequestDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireLogin();
  const { t, locale } = await getDict();

  const b = await requestBundle(id);
  if (!b || b.request.client_id !== s.uid) notFound();
  const r = b.request;
  const signed = b.files.map((f) => ({ id: f.id, file_name: f.file_name, kind: f.kind, ticket: downloadTicket(f.drive_file_id) }));
  const url = process.env.APPS_SCRIPT_URL!;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-navy-700">← {t.dash.myRequests}</Link>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="ltr-num font-mono text-xs text-slate-400">#{r.reference_no}</div>
            <h1 className="mt-1 text-xl font-bold text-navy-900">{requestLabel(t, r.request_type, r.sub_type)}</h1>
            <p className="mt-1 text-sm text-slate-500">{fmtDate(r.created_at, locale, true)}</p>
          </div>
          <StatusBadge status={r.status} label={t.status[r.status]} />
        </div>
        {r.description && <p className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{r.description}</p>}
      </div>

      {r.admin_message && (
        <div className={`rounded-2xl p-5 ring-1 ${r.status === "needs_documents" ? "bg-orange-50 ring-orange-200" : "bg-blue-50 ring-blue-200"}`}>
          <h2 className="text-sm font-bold text-navy-900">{t.dash.officeMessage}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">{r.admin_message}</p>
        </div>
      )}

      {r.status === "needs_documents" && (
        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 font-bold text-navy-900">{t.dash.uploadMore}</h2>
          <UploadMore t={t} requestId={id} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 font-bold text-navy-900">{t.dash.finalFiles}</h2>
          <FileList url={url} files={signed.filter((f) => f.kind === "office_deliverable")} downloadLabel={t.dash.download} />
        </div>
        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 font-bold text-navy-900">{t.dash.myAttachments}</h2>
          <FileList url={url} files={signed.filter((f) => f.kind === "client_attachment")} downloadLabel={t.dash.download} />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-5 font-bold text-navy-900">{t.dash.timeline}</h2>
        <ol className="relative space-y-5 border-s-2 border-slate-200 ps-6">
          {b.history.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -start-[31px] top-1 h-3 w-3 rounded-full bg-gold-500 ring-4 ring-white" />
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={h.new_status} label={t.status[h.new_status]} />
                <span className="text-xs text-slate-400">{fmtDate(h.created_at, locale, true)}</span>
              </div>
              {h.message && <p className="mt-1.5 text-sm text-slate-600">{h.message}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
