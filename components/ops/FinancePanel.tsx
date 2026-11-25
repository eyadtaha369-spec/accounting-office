"use client";
import Link from "next/link";
import { useState } from "react";
import { FIN_CATEGORIES, FIN_METHODS, type Dict, type Locale } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { saveFinance, deleteFinance } from "@/app/admin/ops-actions";
import DeleteButton from "./DeleteButton";
import { Empty } from "./Panel";
import { Icon } from "../Icons";
import { useAdmin } from "../store/stores";
import { isTmp, nowIso, patchById, removeById, replaceById, tmpId } from "@/lib/view";

export type FinanceView = { id: string; type: string; category: string; amount: string; date: string; client_id: string; clientName: string; description: string; method: string };
type Opt = { id: string; name: string };

export default function FinancePanel({ t, locale, rows, clients }: { t: Dict; locale: Locale; rows: FinanceView[]; clients: Opt[] }) {
  const o = t.ops;
  const s = useAdmin();
  const blank = { id: "", type: "income", category: "fees", amount: "", date: new Date().toISOString().slice(0, 10), client_id: "", description: "", method: "cash" };
  const [form, setForm] = useState<typeof blank | null>(null);
  const [err, setErr] = useState(false);
  const set = (k: string, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const amt = Number(String(form.amount).replace(/,/g, ""));
    if (!(amt > 0) || !form.date) return setErr(true);
    setErr(false);
    const f = { ...form, amount: String(amt) };
    const id = f.id || tmpId();
    const row = { ...f, id, created_at: nowIso() };
    setForm(null);
    void s.mutate({
      apply: (d) => ({ ...d, Finance: f.id ? patchById(d.Finance, f.id, f) : [row, ...d.Finance] }),
      run: () => saveFinance(f),
      commit: (d, res) => (res.ok ? { ...d, Finance: replaceById(d.Finance, id, res.row) } : d),
      error: t.sync.saveFailed,
    });
  }
  const remove = (id: string) =>
    void s.mutate({
      apply: (d) => ({ ...d, Finance: removeById(d.Finance, id) }),
      run: () => (isTmp(id) ? Promise.resolve({ ok: true }) : deleteFinance(id)),
      error: t.sync.saveFailed,
    });

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2 px-5 pt-4">
        {!form && (
          <>
            <button onClick={() => setForm({ ...blank, type: "income", category: "fees" })} className="btn bg-emerald-600 text-white hover:bg-emerald-700">
              <Icon name="up" className="h-4 w-4" /> {o.income}
            </button>
            <button onClick={() => setForm({ ...blank, type: "expense", category: "rent" })} className="btn bg-red-600 text-white hover:bg-red-700">
              <Icon name="down" className="h-4 w-4" /> {o.expense}
            </button>
          </>
        )}
      </div>
      {form && (
        <form onSubmit={submit} className={`m-5 grid gap-4 rounded-xl p-4 ring-1 sm:grid-cols-2 lg:grid-cols-3 ${form.type === "income" ? "bg-emerald-50/50 ring-emerald-200" : "bg-red-50/50 ring-red-200"}`}>
          <div>
            <label className="label">{o.type}</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className="input">
              <option value="income">{o.income}</option>
              <option value="expense">{o.expense}</option>
            </select>
          </div>
          <div>
            <label className="label">{o.amount}</label>
            <input required inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">{o.date}</label>
            <input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">{o.category}</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input">
              {FIN_CATEGORIES.map((c) => <option key={c} value={c}>{o.categories[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{o.method}</label>
            <select value={form.method} onChange={(e) => set("method", e.target.value)} className="input">
              {FIN_METHODS.map((m) => <option key={m} value={m}>{o.methods[m]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{o.client}</label>
            <select value={form.client_id} onChange={(e) => set("client_id", e.target.value)} className="input">
              <option value="">{o.noClient}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">{o.description}</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)} className="input" />
          </div>
          {err && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{t.auth.errors.generic}</p>}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button className="btn-navy">{o.save}</button>
            <button type="button" onClick={() => setForm(null)} className="btn-outline">{o.cancel}</button>
          </div>
        </form>
      )}
      {rows.length === 0 ? (
        <Empty text={o.noData} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-page text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{o.date}</th>
                <th className="px-4 py-3 text-start font-medium">{o.category}</th>
                <th className="px-4 py-3 text-start font-medium">{o.description}</th>
                <th className="px-4 py-3 text-start font-medium">{o.client}</th>
                <th className="px-4 py-3 text-start font-medium">{o.method}</th>
                <th className="px-4 py-3 text-end font-medium">{o.amount}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDate(r.date, locale)}</td>
                  <td className="px-4 py-3 text-slate-700">{o.categories[r.category as keyof typeof o.categories] ?? r.category}</td>
                  <td className="px-4 py-3 text-slate-600">{r.description || "—"}</td>
                  <td className="px-4 py-3">{r.client_id ? <Link href={`/admin/clients/${r.client_id}`} className="text-navy-700 hover:text-gold-600">{r.clientName}</Link> : "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{o.methods[r.method as keyof typeof o.methods] ?? r.method}</td>
                  <td className={`ltr-num px-4 py-3 text-end font-semibold ${r.type === "income" ? "text-emerald-700" : "text-red-600"}`}>
                    {r.type === "income" ? "+" : "−"}{Number(r.amount).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setForm({ ...r })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-700" title={o.edit}>
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <DeleteButton onDelete={() => remove(r.id)} label={o.delete} confirm={o.confirmDelete} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
