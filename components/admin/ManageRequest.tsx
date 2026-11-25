"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkFiles } from "@/lib/format";
import { uploadDirect } from "@/lib/direct";
import { getRequestUploadTicket, registerUploads } from "@/app/file-actions";
import { updateRequest } from "@/app/admin/actions";
import { STATUSES, type Status } from "@/lib/i18n";
import { useAdmin } from "@/components/store/stores";
import { useI18n, useMe } from "@/components/store/I18n";
import { nowIso, patchById, replaceById, tmpId } from "@/lib/view";
import type { R } from "@/lib/store-types";

export default function ManageRequest({ request }: { request: R }) {
  const s = useAdmin();
  const me = useMe();
  const { t } = useI18n();
  const router = useRouter();
  const current = request.status as Status;
  const [status, setStatus] = useState<Status>(current);
  const [message, setMessage] = useState(request.admin_message ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setMsg(null);
    if (status === "needs_documents" && !message.trim()) return setMsg(t.auth.errors.required);
    if (!checkFiles(files)) return setMsg(t.dash.fileTypeDocs);
    // الملفات تُرفع أولاً (تحتاج وقت الرفع الفعلي) حتى يجدها العميل جاهزة
    if (files.length) {
      setUploading(true);
      try {
        const tk = await getRequestUploadTicket(request.id);
        const uploaded = await Promise.all(files.map((f) => uploadDirect(tk, f)));
        const res = await registerUploads(tk.ticket, uploaded);
        s.addTickets(res.tickets);
        void s.mutate({ apply: (d) => ({ ...d, Files: [...d.Files, ...res.rows] }), run: async () => ({ ok: true }) });
        setFiles([]);
      } catch {
        setUploading(false);
        return setMsg(t.auth.errors.generic);
      }
      setUploading(false);
    }
    // تحديث فوري للحالة ثم الحفظ في الخلفية
    const msgText = message.trim();
    const hid = tmpId();
    const changed = status !== current;
    const patch: R = { status, admin_message: msgText, assigned_to: me.uid };
    if (changed) patch.completed_at = status === "completed" ? nowIso() : "";
    void s.mutate({
      apply: (d) => ({
        ...d,
        Requests: patchById(d.Requests, request.id, patch),
        StatusHistory: changed
          ? [...d.StatusHistory, { id: hid, request_id: request.id, old_status: current, new_status: status, message: msgText, changed_by: me.uid, created_at: nowIso() }]
          : d.StatusHistory,
      }),
      run: () => updateRequest(request.id, status, message),
      commit: (d, res) =>
        res.ok
          ? {
              ...d,
              Requests: replaceById(d.Requests, request.id, res.request),
              StatusHistory: res.history ? replaceById(d.StatusHistory, hid, res.history) : d.StatusHistory.filter((h) => h.id !== hid),
            }
          : d,
      error: t.sync.saveFailed,
      success: t.admin.updated,
    });
    if (status === "completed") router.push("/admin");
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="label">{t.admin.newStatus}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatus(st)}
              className={`rounded-lg px-2 py-2.5 text-xs font-semibold ring-1 transition ${status === st ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"}`}
            >
              {t.status[st]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{t.admin.messageToClient}</label>
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="input" placeholder={status === "needs_documents" ? t.admin.messagePlaceholderDocs : ""} />
      </div>
      <div>
        <label className="label">{t.admin.deliverable}</label>
        <input
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-gold-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-400"
        />
      </div>
      {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}
      <button onClick={save} disabled={uploading} className="btn-navy w-full sm:w-auto">
        {uploading ? t.common.loading : t.admin.update}
      </button>
    </div>
  );
}
