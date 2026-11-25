"use client";
import { useState } from "react";
import ScanCamera from "./ScanCamera";
import { Icon } from "@/components/Icons";
import { useAdmin } from "@/components/store/stores";
import { useI18n, useMe } from "@/components/store/I18n";
import { addArchiveDoc, getArchiveTicket } from "@/app/archive-actions";
import { uploadDirect } from "@/lib/direct";
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from "@/lib/format";
import { usePages } from "@/components/store/SitePages";
import { nowIso, replaceById, tmpId } from "@/lib/view";

/** إضافة مستند / Scan ورقة — يظهر فوراً في المجلد ويُرفع في الخلفية */
export default function AddDocForm({ clientId, years, year, section, lockSection = false, onDone }: {
  clientId: string; years: string[]; year: string; section: string; lockSection?: boolean; onDone: () => void;
}) {
  const s = useAdmin();
  const me = useMe();
  const { t } = useI18n();
  const pages = usePages();
  const sections = ["general", ...pages.all.filter((p) => p.is_active !== "no" || p.id === section).map((p) => p.id)];
  const [f, setF] = useState({ year, section, title: "", visible: true });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [camera, setCamera] = useState(false);
  const [err, setErr] = useState("");

  function pick(x: File | null) {
    setErr("");
    if (preview) URL.revokeObjectURL(preview);
    if (x && (!ALLOWED_DOC_TYPES.includes(x.type) || x.size > MAX_DOC_BYTES)) {
      setFile(null);
      setPreview("");
      return setErr(t.dash.fileTypeDocs);
    }
    setFile(x);
    setPreview(x && x.type.startsWith("image/") ? URL.createObjectURL(x) : "");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const title = f.title.trim();
    if (!title) return setErr(t.auth.errors.required + " — " + t.arch.docName);
    if (!file) return setErr(t.auth.errors.required + " — " + t.arch.fromDevice);
    const id = tmpId();
    const tmp = {
      id, client_id: clientId, year: f.year, section: f.section, title, drive_file_id: "", file_name: file.name, mime_type: file.type,
      link: "", is_visible: f.visible ? "yes" : "no", uploaded_by: me.uid, created_at: nowIso(), updated_at: nowIso(),
    };
    const up = file;
    onDone();
    void s.mutate({
      apply: (d) => ({ ...d, ArchiveDocs: [tmp, ...d.ArchiveDocs] }),
      run: async () => {
        const tk = await getArchiveTicket(clientId);
        const u = await uploadDirect(tk, up);
        return addArchiveDoc(clientId, { year: f.year, section: f.section, title, visible: f.visible }, tk.ticket, u);
      },
      commit: (d, r) => {
        if (!r.ok) return { ...d, ArchiveDocs: d.ArchiveDocs.filter((x) => x.id !== id) };
        if (r.ticket) s.addTickets({ [r.doc.drive_file_id]: r.ticket });
        const hasYear = d.ArchiveYears.some((y) => y.id === r.year.id);
        return { ...d, ArchiveDocs: replaceById(d.ArchiveDocs, id, r.doc), ArchiveYears: hasYear ? d.ArchiveYears : [...d.ArchiveYears, r.year] };
      },
      error: t.sync.saveFailed,
    });
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl bg-page p-4 ring-1 ring-gold-400/40 sm:p-5">
      <div className="flex items-center gap-2 font-bold text-navy-900"><Icon name="plus" className="h-4 w-4 text-gold-600" /> {t.arch.addDoc}</div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="label">{t.arch.docName} <span className="text-red-500">*</span></label>
          <input autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={t.arch.docNamePh} className="input" maxLength={200} />
        </div>
        <div>
          <label className="label">{t.arch.year}</label>
          <select value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} className="input ltr-num">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">{t.arch.section}</label>
          <select value={f.section} disabled={lockSection} onChange={(e) => setF({ ...f, section: e.target.value })} className="input">
            {sections.map((k) => <option key={k} value={k}>{pages.label(k)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-semibold text-navy-800 hover:border-gold-500">
          <Icon name="upload" className="h-5 w-5 text-gold-600" /> {t.arch.fromDevice}
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
        <button type="button" onClick={() => setCamera(true)} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-semibold text-navy-800 hover:border-gold-500">
          <Icon name="camera" className="h-5 w-5 text-gold-600" /> {t.arch.scan}
        </button>
      </div>
      {/* بديل للموبايل: فتح الكاميرا الخلفية مباشرة من منتقي الملفات */}
      <label className="block text-center text-xs text-slate-500 sm:hidden">
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <span className="cursor-pointer underline">📱 {t.arch.scan}</span>
      </label>

      {file && (
        <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          {preview ? <img src={preview} alt="" className="h-16 w-12 rounded object-cover ring-1 ring-slate-200" /> : <Icon name="file" className="h-8 w-8 text-gold-600" />}
          <div className="min-w-0 flex-1 truncate text-sm text-slate-700">{file.name}</div>
          <button type="button" onClick={() => pick(null)} className="text-slate-400 hover:text-red-600" aria-label="remove"><Icon name="close" className="h-4 w-4" /></button>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={f.visible} onChange={(e) => setF({ ...f, visible: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
        <Icon name={f.visible ? "eye" : "eyeOff"} className={`h-4 w-4 ${f.visible ? "text-emerald-600" : "text-slate-400"}`} /> {t.arch.showToClient}
      </label>

      {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button className="btn-navy"><Icon name="upload" className="h-4 w-4" /> {t.arch.save}</button>
        <button type="button" onClick={onDone} className="btn-outline">{t.ops.cancel}</button>
      </div>
      {camera && <ScanCamera onCancel={() => setCamera(false)} onDone={(x) => { setCamera(false); pick(x); }} />}
    </form>
  );
}
