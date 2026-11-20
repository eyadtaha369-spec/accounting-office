"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_TYPES, STATUSES, TAX_RETURN_TYPES, type Dict, type Status } from "@/lib/i18n";
import { checkFiles } from "@/lib/format";
import { uploadDirect } from "@/lib/direct";
import { registerUploads } from "@/app/file-actions";
import { adminCreateRequest } from "../../actions";

export default function AddRequestForm({ t, clientId }: { t: Dict; clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("tax_return");
  const [sub, setSub] = useState<string>("vat");
  const [status, setStatus] = useState<Status>("completed");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setMsg(null);
    if (type === "other" && !desc.trim()) return setMsg({ ok: false, text: t.dash.otherDescRequired });
    if (!checkFiles(files)) return setMsg({ ok: false, text: t.dash.fileTypeDocs });
    setLoading(true);
    try {
      const res = await adminCreateRequest(clientId, { type, sub, description: desc, status, message, date });
      if ("error" in res) throw new Error(res.error);
      if (files.length) {
        const up = await Promise.all(files.map((f) => uploadDirect(res.upload, f)));
        await registerUploads(res.upload.ticket, up);
      }
      setMsg({ ok: true, text: t.admin.requestAdded });
      setDesc("");
      setMessage("");
      setFiles([]);
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message === "desc" ? t.dash.otherDescRequired : t.auth.errors.generic });
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-gold">
        + {t.admin.addRequest}
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{t.admin.addRequestHint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">{t.dash.chooseService}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            {REQUEST_TYPES.map((r) => (
              <option key={r} value={r}>{t.requestTypes[r]}</option>
            ))}
          </select>
        </div>
        {type === "tax_return" && (
          <div>
            <label className="label">{t.dash.returnType}</label>
            <select value={sub} onChange={(e) => setSub(e.target.value)} className="input">
              {TAX_RETURN_TYPES.map((r) => (
                <option key={r} value={r}>{t.taxReturnTypes[r]}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">{t.admin.initialStatus}</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="input">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t.status[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t.admin.requestDate}</label>
          <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="input" dir="ltr" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{t.dash.notes}</label>
          <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{t.admin.messageToClient}</label>
          <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{t.admin.deliverable}</label>
          <input
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-gold-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-950"
          />
        </div>
      </div>
      {msg && <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading} className="btn-navy">{loading ? t.common.loading : t.admin.saveRequest}</button>
        <button onClick={() => setOpen(false)} className="btn-outline">{t.common.cancel}</button>
      </div>
    </div>
  );
}
