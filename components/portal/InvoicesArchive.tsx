"use client";
import { useMemo, useState } from "react";
import { useI18n, useMe } from "@/components/store/I18n";
import { Icon } from "@/components/Icons";
import { openDriveFile } from "./openFile";
import { uploadDirect } from "@/lib/direct";
import { checkFiles, fmtDate } from "@/lib/format";
import { addInvoice, deleteInvoice, getPortalTicket } from "@/app/portal-actions";
import { isTmp, nowIso, removeById, replaceById, tmpId } from "@/lib/view";
import type { PortalStore } from "./types";
import type { R } from "@/lib/store-types";

/** أرشيف الفواتير الشهرية: سنة ← شهر ← (مبيعات / مشتريات) */
export default function InvoicesArchive({ store: s, rows, clientId }: { store: PortalStore; rows: R[]; clientId?: string }) {
  const { t, locale } = useI18n();
  const me = useMe();
  const p = t.portal;
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const years = useMemo(() => {
    const set = new Set([String(now.getFullYear()), String(now.getFullYear() - 1), ...rows.map((r) => r.year)]);
    return [...set].sort().reverse();
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const inYear = rows.filter((r) => r.year === year);
  const count = (m: string, c?: string) => inYear.filter((r) => r.month === m && (!c || r.category === c)).length;
  const monthRows = inYear.filter((r) => r.month === month);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-5 pt-5">
        <label className="text-sm font-semibold text-slate-600">{p.year}</label>
        <div className="flex gap-1.5">
          {years.map((y) => (
            <button key={y} onClick={() => setYear(y)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${year === y ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200"}`}>
              <span className="ltr-num">{y}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-5 sm:grid-cols-4 lg:grid-cols-6">
        {p.months.map((name, i) => {
          const m = String(i + 1);
          const n = count(m);
          return (
            <button
              key={m}
              onClick={() => setMonth(m)}
              className={`rounded-xl p-3 text-start ring-1 transition ${month === m ? "bg-navy-900 text-white ring-navy-900" : n ? "bg-white ring-gold-300 hover:ring-gold-500" : "bg-page ring-slate-200 hover:ring-slate-300"}`}
            >
              <div className="text-sm font-semibold">{name}</div>
              <div className={`mt-1 text-[11px] ${month === m ? "text-gold-300" : "text-slate-500"}`}>
                <span className="ltr-num">{count(m, "sales")}</span> / <span className="ltr-num">{count(m, "purchases")}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 border-t border-slate-100 p-5 lg:grid-cols-2">
        {(["sales", "purchases"] as const).map((cat) => (
          <Bucket
            key={cat}
            title={cat === "sales" ? p.sales : p.purchases}
            tone={cat === "sales" ? "text-emerald-700 bg-emerald-50" : "text-blue-700 bg-blue-50"}
            rows={monthRows.filter((r) => r.category === cat).sort((a, b) => b.created_at.localeCompare(a.created_at))}
            onAdd={async (file, link, note) => {
              const meta = { clientId, year, month, category: cat, note, link };
              if (file) {
                if (!checkFiles([file])) return s.toast(t.dash.fileTypeDocs);
                try {
                  const tk = await getPortalTicket("invoice", clientId);
                  const up = await uploadDirect(tk, file);
                  const r = await addInvoice(meta, tk.ticket, up);
                  if (!r.ok) throw new Error();
                  if (r.ticket) s.addTickets({ [r.row.drive_file_id]: r.ticket });
                  void s.mutate({ apply: (d) => ({ ...d, MonthlyInvoices: [r.row, ...d.MonthlyInvoices] }), run: async () => ({ ok: true }) });
                } catch {
                  s.toast(t.sync.saveFailed);
                }
              } else {
                const id = tmpId();
                void s.mutate({
                  apply: (d) => ({ ...d, MonthlyInvoices: [{ id, client_id: clientId ?? me.uid, year, month, category: cat, link, note, drive_file_id: "", file_name: "", created_at: nowIso() }, ...d.MonthlyInvoices] }),
                  run: () => addInvoice(meta),
                  commit: (d, r) => (r.ok ? { ...d, MonthlyInvoices: replaceById(d.MonthlyInvoices, id, r.row) } : d),
                  error: t.sync.saveFailed,
                });
              }
            }}
            onDelete={(id) =>
              void s.mutate({ apply: (d) => ({ ...d, MonthlyInvoices: removeById(d.MonthlyInvoices, id) }), run: () => (isTmp(id) ? Promise.resolve({ ok: true }) : deleteInvoice(id)), error: t.sync.saveFailed })
            }
            open={(r) => (r.link ? window.open(r.link, "_blank", "noopener") : openDriveFile(s.url, s.ticket(r.drive_file_id)))}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}

function Bucket({ title, tone, rows, onAdd, onDelete, open, locale }: {
  title: string; tone: string; rows: R[];
  onAdd: (file: File | null, link: string, note: string) => Promise<void> | void;
  onDelete: (id: string) => void; open: (r: R) => void; locale: "ar" | "en";
}) {
  const { t } = useI18n();
  const p = t.portal;
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!files.length && !/^https?:\/\//i.test(link.trim())) return;
    setBusy(true);
    if (files.length) for (const f of files) await onAdd(f, "", note.trim());
    else await onAdd(null, link.trim(), note.trim());
    setFiles([]);
    setLink("");
    setNote("");
    setBusy(false);
  }
  return (
    <div className="rounded-xl ring-1 ring-slate-200">
      <div className={`flex items-center justify-between rounded-t-xl px-4 py-3 ${tone}`}>
        <span className="font-semibold">{title}</span>
        <span className="text-xs font-bold"><span className="ltr-num">{rows.length}</span> {p.filesCount}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.length === 0 && <li className="px-4 py-6 text-center text-xs text-slate-400">{p.noInvoices}</li>}
        {rows.map((r) => (
          <li key={r.id} className={`flex items-center gap-2 px-4 py-2.5 ${isTmp(r.id) ? "opacity-60" : ""}`}>
            <Icon name={r.link ? "external" : "file"} className="h-4 w-4 text-gold-600" />
            <button onClick={() => open(r)} className="min-w-0 flex-1 truncate text-start text-sm text-navy-800 hover:text-gold-600">
              {r.file_name || r.link}
            </button>
            {r.note && <span className="hidden max-w-[30%] truncate text-xs text-slate-400 sm:inline">{r.note}</span>}
            <span className="text-[11px] text-slate-400">{fmtDate(r.created_at, locale)}</span>
            <button onClick={() => onDelete(r.id)} className="rounded p-1 text-slate-300 hover:text-red-600" title="×">
              <Icon name="trash" className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-2 border-t border-slate-100 bg-page/60 p-3">
        <input
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-xs text-slate-600 file:me-2 file:rounded-md file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
        {!files.length && <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={`${p.orLink} https://`} className="input py-1.5 text-xs" dir="ltr" />}
        <div className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={p.invoiceNote} className="input py-1.5 text-xs" />
          <button onClick={add} disabled={busy} className="btn-gold shrink-0 px-3 py-1.5 text-xs">{busy ? "…" : `+ ${p.addInvoice}`}</button>
        </div>
      </div>
    </div>
  );
}
