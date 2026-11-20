"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RECORD_SERVICES, RECORD_STATUSES, RECORD_STATUS_STYLES, type Dict, type Locale } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { saveRecord, deleteRecord } from "@/app/admin/ops-actions";
import DeleteButton from "./DeleteButton";
import { Empty, Pill } from "./Panel";
import { Icon } from "../Icons";

export type RecordView = { id: string; client_id: string; clientName: string; service: string; period: string; due_date: string; status: string; amount: string; reference: string; notes: string };
type Opt = { id: string; name: string };

const blank = (service: string, clientId: string) => ({ id: "", client_id: clientId, service, period: "", due_date: "", status: "pending", amount: "", reference: "", notes: "" });

export default function RecordsPanel({ t, locale, rows, clients, service = "", lockedClientId = "" }: {
  t: Dict; locale: Locale; rows: RecordView[]; clients: Opt[]; service?: string; lockedClientId?: string;
}) {
  const o = t.ops;
  const router = useRouter();
  const [form, setForm] = useState<ReturnType<typeof blank> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setErr(false);
    const r = await saveRecord(form);
    setBusy(false);
    if (!r.ok) return setErr(true);
    setForm(null);
    router.refresh();
  }
  const set = (k: string, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div>
      <div className="flex justify-end px-5 pt-4">
        {!form && (
          <button onClick={() => setForm(blank(service || "vat", lockedClientId))} className="btn-gold">
            <Icon name="plus" className="h-4 w-4" /> {o.add}
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={submit} className="m-5 grid gap-4 rounded-xl bg-page p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {!lockedClientId && (
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="label">{o.client}</label>
              <select required value={form.client_id} onChange={(e) => set("client_id", e.target.value)} className="input">
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{t.dash.service}</label>
            <select value={form.service} onChange={(e) => set("service", e.target.value)} className="input">
              {RECORD_SERVICES.map((s) => <option key={s} value={s}>{o.services[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{o.period}</label>
            <input value={form.period} onChange={(e) => set("period", e.target.value)} placeholder={o.periodHint} className="input" />
          </div>
          <div>
            <label className="label">{o.dueDate}</label>
            <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">{o.status}</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input">
              {RECORD_STATUSES.map((s) => <option key={s} value={s}>{o.recordStatus[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{o.amount}</label>
            <input inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">{o.reference}</label>
            <input value={form.reference} onChange={(e) => set("reference", e.target.value)} className="input" dir="ltr" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">{o.notes}</label>
            <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className="input" />
          </div>
          {err && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{t.auth.errors.generic}</p>}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button disabled={busy} className="btn-navy">{busy ? t.common.loading : o.save}</button>
            <button type="button" onClick={() => setForm(null)} className="btn-outline">{o.cancel}</button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <Empty text={o.noData} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-page text-xs text-slate-500">
              <tr>
                {!lockedClientId && <th className="px-4 py-3 text-start font-medium">{o.client}</th>}
                <th className="px-4 py-3 text-start font-medium">{t.dash.service}</th>
                <th className="px-4 py-3 text-start font-medium">{o.period}</th>
                <th className="px-4 py-3 text-start font-medium">{o.dueDate}</th>
                <th className="px-4 py-3 text-start font-medium">{o.amount}</th>
                <th className="px-4 py-3 text-start font-medium">{o.reference}</th>
                <th className="px-4 py-3 text-start font-medium">{o.status}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const late = r.status !== "filed" && r.due_date && r.due_date < today;
                const st = late && r.status !== "late" ? "late" : r.status;
                return (
                  <tr key={r.id} className="hover:bg-page/60">
                    {!lockedClientId && (
                      <td className="px-4 py-3">
                        <Link href={`/admin/clients/${r.client_id}`} className="font-medium text-navy-800 hover:text-gold-600">{r.clientName}</Link>
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-700">{o.services[r.service as keyof typeof o.services] ?? r.service}</td>
                    <td className="px-4 py-3 text-slate-700">{r.period || "—"}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${late ? "font-semibold text-red-600" : "text-slate-500"}`}>{r.due_date ? fmtDate(r.due_date, locale) : "—"}</td>
                    <td className="ltr-num px-4 py-3 text-slate-700">{r.amount ? Number(r.amount).toLocaleString("en-US") : "—"}</td>
                    <td className="ltr-num px-4 py-3 font-mono text-xs text-slate-500">{r.reference || "—"}</td>
                    <td className="px-4 py-3"><Pill className={RECORD_STATUS_STYLES[st]}>{o.recordStatus[st as keyof typeof o.recordStatus]}</Pill></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setForm({ ...r })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-700" title={o.edit}>
                          <Icon name="edit" className="h-4 w-4" />
                        </button>
                        <DeleteButton onDelete={() => deleteRecord(r.id)} label={o.delete} confirm={o.confirmDelete} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
