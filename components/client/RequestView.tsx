"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import FileList from "@/components/FileList";
import { useClient } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { checkFiles, fmtDate } from "@/lib/format";
import { requestLabel } from "@/lib/labels";
import { uploadDirect } from "@/lib/direct";
import { getRequestUploadTicket, registerUploads, resubmitRequest } from "@/app/file-actions";
import { asc, nowIso, patchById, replaceById, tmpId } from "@/lib/view";
import type { Status } from "@/lib/i18n";
import Stepper from "@/components/portal/Stepper";
import { openDriveFile } from "@/components/portal/openFile";
import { Icon } from "@/components/Icons";

export default function RequestView() {
  const { id } = useParams<{ id: string }>();
  const s = useClient();
  const { t, locale } = useI18n();
  return (
    <Guard s={s}>
      {(d) => {
        const r = d.Requests.find((x) => x.id === id);
        if (!r) return <p className="card p-10 text-center text-slate-500">404</p>;
        const files = d.Files.filter((f) => f.request_id === id).sort(asc()).map((f) => ({ id: f.id, file_name: f.file_name, kind: f.kind, ticket: s.ticket(f.drive_file_id) }));
        const history = d.StatusHistory.filter((h) => h.request_id === id).sort(asc());
        const status = r.status as Status;
        return (
          <div className="space-y-6">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-navy-700">← {t.dash.myRequests}</Link>
            <div className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="ltr-num font-mono text-xs text-slate-400">#{r.reference_no}</div>
                  <h1 className="mt-1 text-xl font-bold text-navy-900">{requestLabel(t, r.request_type, r.sub_type)}</h1>
                  <p className="mt-1 text-sm text-slate-500">{fmtDate(r.created_at, locale, true)}</p>
                </div>
                <StatusBadge status={status} label={t.status[status]} />
              </div>
              {r.description && <p className="mt-5 whitespace-pre-wrap rounded-xl bg-page p-4 text-sm leading-7 text-slate-700">{r.description}</p>}
              <div className="mt-6 rounded-2xl bg-page p-4 sm:p-5">
                <Stepper status={r.status} />
                {r.admin_message && (
                  <div className={`mt-4 rounded-xl p-4 ring-1 ${status === "needs_documents" ? "bg-orange-50 ring-orange-200" : "bg-white ring-slate-200"}`}>
                    <h2 className="text-xs font-bold text-gold-600">✍️ {t.portal.accountantNotes}</h2>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-7 text-slate-800">{r.admin_message}</p>
                  </div>
                )}
                {files.some((f) => f.kind === "office_deliverable") && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {files.filter((f) => f.kind === "office_deliverable").map((f) => (
                      <button key={f.id} onClick={() => openDriveFile(s.url, f.ticket)} className="btn-gold">
                        <Icon name="download" className="h-4 w-4" /> {t.portal.downloadFinal}: {f.file_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {status === "needs_documents" && (
              <div className="card p-5 sm:p-6">
                <h2 className="mb-4 font-bold text-navy-900">{t.dash.uploadMore}</h2>
                <UploadMore requestId={id} />
              </div>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-5 sm:p-6">
                <h2 className="mb-4 font-bold text-navy-900">{t.dash.finalFiles}</h2>
                <FileList url={s.url} files={files.filter((f) => f.kind === "office_deliverable")} downloadLabel={t.dash.download} />
              </div>
              <div className="card p-5 sm:p-6">
                <h2 className="mb-4 font-bold text-navy-900">{t.dash.myAttachments}</h2>
                <FileList url={s.url} files={files.filter((f) => f.kind === "client_attachment")} downloadLabel={t.dash.download} />
              </div>
            </div>
            <div className="card p-5 sm:p-6">
              <h2 className="mb-5 font-bold text-navy-900">{t.dash.timeline}</h2>
              <ol className="relative space-y-5 border-s-2 border-slate-200 ps-6">
                {history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -start-[31px] top-1 h-3 w-3 rounded-full bg-gold-500 ring-4 ring-white" />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={h.new_status as Status} label={t.status[h.new_status as Status]} />
                      <span className="text-xs text-slate-400">{fmtDate(h.created_at, locale, true)}</span>
                    </div>
                    {h.message && <p className="mt-1.5 text-sm text-slate-600">{h.message}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      }}
    </Guard>
  );
}

function UploadMore({ requestId }: { requestId: string }) {
  const s = useClient();
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setError("");
    if (!files.length) return setError(t.auth.errors.required);
    if (!checkFiles(files)) return setError(t.dash.fileTypeDocs);
    setLoading(true);
    try {
      const tk = await getRequestUploadTicket(requestId);
      const uploaded = await Promise.all(files.map((f) => uploadDirect(tk, f)));
      const reg = await registerUploads(tk.ticket, uploaded);
      s.addTickets(reg.tickets);
      setFiles([]);
      const hid = tmpId();
      void s.mutate({
        apply: (d) => ({
          ...d,
          Files: [...d.Files, ...reg.rows],
          Requests: patchById(d.Requests, requestId, { status: "pending_review" }),
          StatusHistory: [...d.StatusHistory, { id: hid, request_id: requestId, old_status: "needs_documents", new_status: "pending_review", message: "", created_at: nowIso() }],
        }),
        run: () => resubmitRequest(requestId),
        commit: (d, r) => (r.ok && r.history ? { ...d, Requests: replaceById(d.Requests, requestId, r.request), StatusHistory: replaceById(d.StatusHistory, hid, r.history) } : d),
        error: t.sync.saveFailed,
      });
    } catch {
      setError(t.auth.errors.generic);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        multiple
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-800"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={go} disabled={loading} className="btn-gold">{loading ? t.auth.submitting : t.dash.uploadAndResubmit}</button>
    </div>
  );
}
