"use client";
import Link from "next/link";
import { useState } from "react";
import { DOC_CATEGORIES, type Dict, type Locale } from "@/lib/i18n";
import { checkFiles, fmtDate } from "@/lib/format";
import { downloadDirect, uploadDirect } from "@/lib/direct";
import { deleteDocument, getDocTicket, registerDocument } from "@/app/admin/ops-actions";
import DeleteButton from "./DeleteButton";
import { Empty, Pill } from "./Panel";
import { Icon } from "../Icons";
import { useAdmin } from "../store/stores";
import { removeById } from "@/lib/view";

export type DocView = { id: string; client_id: string; clientName: string; title: string; category: string; file_name: string; visible_to_client: string; created_at: string; ticket: string };
type Opt = { id: string; name: string };

export default function DocsPanel({ t, locale, rows, clients, url, lockedClientId = "" }: {
  t: Dict; locale: Locale; rows: DocView[]; clients: Opt[]; url: string; lockedClientId?: string;
}) {
  const o = t.ops;
  const s = useAdmin();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(lockedClientId);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [visible, setVisible] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dl, setDl] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!clientId || !file) return setErr(t.auth.errors.required);
    if (!checkFiles([file])) return setErr(t.dash.fileTypeDocs);
    setBusy(true);
    try {
      const tk = await getDocTicket(clientId);
      const up = await uploadDirect(tk, file);
      const r = await registerDocument(tk.ticket, up, { title, category, visible });
      if (!r.ok) throw new Error();
      s.addTickets({ [r.doc.drive_file_id]: r.ticket });
      void s.mutate({ apply: (d) => ({ ...d, Documents: [r.doc, ...d.Documents] }), run: async () => ({ ok: true }) });
      setOpen(false);
      setTitle("");
      setFile(null);
    } catch {
      setErr(t.auth.errors.generic);
    }
    setBusy(false);
  }

  async function download(d: DocView) {
    setDl(d.id);
    const win = window.open("", "_blank");
    try {
      const blob = await downloadDirect(url, d.ticket);
      const href = URL.createObjectURL(blob);
      if (win) win.location.href = href;
    } catch {
      win?.close();
    }
    setDl(null);
  }

  return (
    <div>
      <div className="flex justify-end px-5 pt-4">
        {!open && (
          <button onClick={() => setOpen(true)} className="btn-gold">
            <Icon name="upload" className="h-4 w-4" /> {o.uploadDoc}
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="m-5 grid gap-4 rounded-xl bg-page p-4 ring-1 ring-slate-200 sm:grid-cols-2">
          {!lockedClientId && (
            <div>
              <label className="label">{o.client}</label>
              <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="input">
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{o.docTitle}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{o.docCategory}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{o.docCats[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{o.file}</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-[#14243b]" />
            {o.visibleToClient}
          </label>
          {err && <p className="text-sm text-red-600 sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className="btn-navy">{busy ? t.common.loading : o.upload}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline">{o.cancel}</button>
          </div>
        </form>
      )}
      {rows.length === 0 ? (
        <Empty text={o.noData} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Icon name="file" className="h-5 w-5 text-gold-600" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800">{d.title}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                  {!lockedClientId && (
                    <Link href={`/admin/clients/${d.client_id}`} className="text-navy-700 hover:text-gold-600">{d.clientName}</Link>
                  )}
                  <span>{fmtDate(d.created_at, locale)}</span>
                  <span className="truncate">{d.file_name}</span>
                </div>
              </div>
              <Pill className="bg-slate-100 text-slate-700 ring-slate-200">{o.docCats[d.category as keyof typeof o.docCats] ?? d.category}</Pill>
              {d.visible_to_client === "yes" && <Pill className="bg-emerald-50 text-emerald-700 ring-emerald-200">👁</Pill>}
              <button onClick={() => download(d)} disabled={dl === d.id} className="btn-outline px-3 py-1.5 text-xs">
                {dl === d.id ? "…" : o.download}
              </button>
              <DeleteButton onDelete={() => void s.mutate({ apply: (x) => ({ ...x, Documents: removeById(x.Documents, d.id) }), run: () => deleteDocument(d.id), error: t.sync.saveFailed })} label={o.delete} confirm={o.confirmDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
