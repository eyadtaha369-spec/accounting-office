"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_TYPES, TAX_RETURN_TYPES, type Dict } from "@/lib/i18n";
import { checkFiles } from "@/lib/format";
import { uploadDirect } from "@/lib/direct";
import { createRequest } from "../actions";
import { registerUploads } from "@/app/file-actions";
import { Icon } from "@/components/Icons";

export default function NewRequestForm({ t, initialType }: { t: Dict; initialType: string }) {
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [sub, setSub] = useState<string>("vat");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (type === "other" && !desc.trim()) return setError(t.dash.otherDescRequired);
    if (!checkFiles(files)) return setError(t.dash.fileTypeDocs);
    setLoading(true);
    try {
      const res = await createRequest(type, type === "tax_return" ? sub : null, desc);
      if ("error" in res) {
        setError(res.error === "desc" ? t.dash.otherDescRequired : t.auth.errors.generic);
        setLoading(false);
        return;
      }
      if (files.length) {
        const uploaded = await Promise.all(files.map((f) => uploadDirect(res.upload, f)));
        await registerUploads(res.upload.ticket, uploaded);
      }
    } catch {
      setError(t.auth.errors.generic);
      setLoading(false);
      return;
    }
    router.push("/dashboard?submitted=1");
    router.refresh();
  }

  return (
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
              <input type="radio" name="type" value={rt} checked={type === rt} onChange={() => setType(rt)} className="mt-0.5 accent-[#0b1f3a]" />
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
      <button type="submit" disabled={loading} className="btn-navy w-full py-3 text-base">
        {loading ? t.auth.submitting : t.dash.submit}
      </button>
    </form>
  );
}
