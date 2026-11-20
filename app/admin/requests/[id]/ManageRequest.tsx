"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkFiles } from "@/lib/format";
import { uploadDirect } from "@/lib/direct";
import { getRequestUploadTicket, registerUploads } from "@/app/file-actions";
import { updateRequest } from "../../actions";
import { STATUSES, type Dict, type Status } from "@/lib/i18n";

export default function ManageRequest({ t, requestId, current, currentMessage }: {
  t: Dict;
  requestId: string;
  current: Status;
  currentMessage: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(current);
  const [message, setMessage] = useState(currentMessage ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setMsg(null);
    if (status === "needs_documents" && !message.trim()) return setMsg({ ok: false, text: t.auth.errors.required });
    if (!checkFiles(files)) return setMsg({ ok: false, text: t.dash.fileTypeDocs });
    setLoading(true);
    try {
      // نرفع الملفات أولاً حتى يجدها العميل جاهزة لحظة ظهور "تم التنفيذ"
      if (files.length) {
        const tk = await getRequestUploadTicket(requestId);
        const uploaded = await Promise.all(files.map((f) => uploadDirect(tk, f)));
        await registerUploads(tk.ticket, uploaded);
      }
      const res = await updateRequest(requestId, status, message);
      if (!res.ok) throw new Error("failed");
      setFiles([]);
      setMsg({ ok: true, text: t.admin.updated });
      router.refresh();
      if (status === "completed") setTimeout(() => router.push("/admin"), 700);
    } catch {
      setMsg({ ok: false, text: t.auth.errors.generic });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="label">{t.admin.newStatus}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-lg px-2 py-2.5 text-xs font-semibold ring-1 transition ${
                status === s ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"
              }`}
            >
              {t.status[s]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{t.admin.messageToClient}</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input"
          placeholder={status === "needs_documents" ? t.admin.messagePlaceholderDocs : ""}
        />
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
      {msg && <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button onClick={save} disabled={loading} className="btn-navy w-full sm:w-auto">
        {loading ? t.common.loading : t.admin.update}
      </button>
    </div>
  );
}
