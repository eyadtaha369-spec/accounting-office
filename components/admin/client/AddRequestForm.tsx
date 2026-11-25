"use client";
import { useState } from "react";
import { REQUEST_TYPES, STATUSES, TAX_RETURN_TYPES, type Dict, type Status } from "@/lib/i18n";
import { checkFiles } from "@/lib/format";
import { uploadDirect } from "@/lib/direct";
import { registerUploads } from "@/app/file-actions";
import { adminCreateRequest } from "@/app/admin/actions";
import { useAdmin } from "@/components/store/stores";
import { useMe } from "@/components/store/I18n";
import { replaceById, tmpId } from "@/lib/view";

export default function AddRequestForm({ t, clientId }: { t: Dict; clientId: string }) {
  const s = useAdmin();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("tax_return");
  const [sub, setSub] = useState<string>("vat");
  const [status, setStatus] = useState<Status>("completed");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    setMsg(null);
    if (type === "other" && !desc.trim()) return setMsg({ ok: false, text: t.dash.otherDescRequired });
    if (!checkFiles(files)) return setMsg({ ok: false, text: t.dash.fileTypeDocs });
    // يظهر الطلب في سجل العميل فوراً، والحفظ ورفع الملفات في الخلفية
    const rid = tmpId();
    const hid = tmpId();
    const now = new Date();
    const created = date && new Date(`${date}T09:00:00Z`) < now ? new Date(`${date}T09:00:00Z`).toISOString() : now.toISOString();
    const pendingFiles = files;
    const input = { type, sub, description: desc, status, message, date };
    void s
      .mutate({
        apply: (d) => ({
          ...d,
          Requests: [
            { id: rid, reference_no: "", client_id: clientId, request_type: type, sub_type: type === "tax_return" ? sub : "", description: desc.trim(), status, admin_message: message.trim(), assigned_to: me.uid, completed_at: status === "completed" ? created : "", created_at: created },
            ...d.Requests,
          ],
          StatusHistory: [...d.StatusHistory, { id: hid, request_id: rid, old_status: "", new_status: status, message: message.trim(), changed_by: me.uid, created_at: created }],
        }),
        run: () => adminCreateRequest(clientId, input),
        commit: (d, r) => ("error" in r ? d : { ...d, Requests: replaceById(d.Requests, rid, r.request), StatusHistory: replaceById(d.StatusHistory, hid, r.history) }),
        error: t.sync.saveFailed,
        success: t.admin.requestAdded,
      })
      .then(async (r) => {
        if (!r || "error" in r || !pendingFiles.length) return;
        try {
          const up = await Promise.all(pendingFiles.map((f) => uploadDirect(r.upload, f)));
          const reg = await registerUploads(r.upload.ticket, up);
          s.addTickets(reg.tickets);
          void s.mutate({ apply: (d) => ({ ...d, Files: [...d.Files, ...reg.rows] }), run: async () => ({ ok: true }) });
        } catch {
          s.toast(t.auth.errors.generic);
        }
      });
    setDesc("");
    setMessage("");
    setFiles([]);
    setOpen(false);
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
        <button onClick={save} className="btn-navy">{t.admin.saveRequest}</button>
        <button onClick={() => setOpen(false)} className="btn-outline">{t.common.cancel}</button>
      </div>
    </div>
  );
}
