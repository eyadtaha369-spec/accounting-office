"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_TYPES, TAX_RETURN_TYPES, type Dict } from "@/lib/i18n";
import { checkFiles } from "@/lib/format";
import { uploadDirect } from "@/lib/direct";
import { createRequest } from "@/app/dashboard/actions";
import { registerUploads } from "@/app/file-actions";
import { Icon } from "@/components/Icons";
import { useClient } from "@/components/store/stores";
import { useMe } from "@/components/store/I18n";
import { nowIso, replaceById, tmpId } from "@/lib/view";
import PoaNotice from "@/components/portal/PoaNotice";

export default function NewRequestForm({ t, initialType }: { t: Dict; initialType: string }) {
  const s = useClient();
  const me = useMe();
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [sub, setSub] = useState<string>("vat");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (type === "other" && !desc.trim()) return setError(t.dash.otherDescRequired);
    if (!checkFiles(files)) return setError(t.dash.fileTypeDocs);
    // الطلب يظهر في "طلباتي" فوراً، والحفظ ورفع المرفقات يكمل في الخلفية
    const rid = tmpId();
    const hid = tmpId();
    const now = nowIso();
    const sub2 = type === "tax_return" ? sub : null;
    const pending = files;
    void s
      .mutate({
        apply: (d) => ({
          ...d,
          Requests: [{ id: rid, reference_no: "", client_id: me.uid, request_type: type, sub_type: sub2 ?? "", description: desc.trim(), status: "pending_review", admin_message: "", created_at: now }, ...d.Requests],
          StatusHistory: [...d.StatusHistory, { id: hid, request_id: rid, old_status: "", new_status: "pending_review", message: "", created_at: now }],
        }),
        run: () => createRequest(type, sub2, desc),
        commit: (d, r) => ("error" in r ? d : { ...d, Requests: replaceById(d.Requests, rid, r.request), StatusHistory: replaceById(d.StatusHistory, hid, r.history) }),
        error: t.sync.saveFailed,
        success: t.dash.submitted,
      })
      .then(async (r) => {
        if (!r || "error" in r || !pending.length) return;
        try {
          const up = await Promise.all(pending.map((f) => uploadDirect(r.upload, f)));
          const reg = await registerUploads(r.upload.ticket, up);
          s.addTickets(reg.tickets);
          void s.mutate({ apply: (d) => ({ ...d, Files: [...d.Files, ...reg.rows] }), run: async () => ({ ok: true }) });
        } catch {
          s.toast(t.auth.errors.generic);
        }
      });
    router.push("/dashboard");
  }

  // الخدمات الضريبية والتأسيسية تحتاج توكيلاً رسمياً للمكتب
  const formal = ["tax_return", "company_formation", "tax_card", "e_invoice", "tax_inspection", "financial_statements"].includes(type);
  const needsPoa = formal && s.data?.Me && s.data.Me.poa_has !== "yes";

  return (
    <div className="space-y-4">
    {needsPoa && <PoaNotice />}
    <form onSubmit={submit} className="card space-y-6 p-5 sm:p-7">
      <div>
        <label className="label">{t.dash.chooseService}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {REQUEST_TYPES.map((rt) => (
            <label
              key={rt}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
                type === rt ? "border-navy-700 bg-navy-900/[0.04] ring-1 ring-navy-700" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input type="radio" name="type" value={rt} checked={type === rt} onChange={() => setType(rt)} className="mt-0.5 accent-[#14243b]" />
              <span className="font-medium text-slate-800">{t.requestTypes[rt]}</span>
            </label>
          ))}
        </div>
      </div>

      {type === "tax_return" && (
        <div>
          <label className="label">{t.dash.returnType}</label>
          <div className="flex flex-wrap gap-2">
            {TAX_RETURN_TYPES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSub(s)}
                className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${
                  sub === s ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-700 ring-slate-300 hover:ring-navy-600"
                }`}
              >
                {t.taxReturnTypes[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="label">
          {t.dash.notes}
          {type === "other" && <span className="text-red-500"> *</span>}
        </label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} className="input" placeholder={t.dash.notesPlaceholder} maxLength={4000} />
      </div>

      <div>
        <label className="label">{t.dash.attachments}</label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 hover:border-navy-600 hover:bg-white">
          <Icon name="upload" className="h-7 w-7 text-slate-400" />
          <span>PDF / JPG / PNG</span>
          <input
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-xs text-red-600 hover:underline">
                  {t.common.cancel}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-navy w-full py-3 text-base">
        {t.dash.submit}
      </button>
    </form>
    </div>
  );
}
