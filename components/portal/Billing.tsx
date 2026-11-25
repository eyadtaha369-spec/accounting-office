"use client";
import { useState } from "react";
import { useI18n, useMe } from "@/components/store/I18n";
import { Icon } from "@/components/Icons";
import { openDriveFile } from "./openFile";
import { uploadDirect } from "@/lib/direct";
import { checkFiles, fmtDate } from "@/lib/format";
import { addCharge, deleteLedger, getPortalTicket, setLedgerStatus, submitPayment } from "@/app/portal-actions";
import { isTmp, nowIso, patchById, removeById, replaceById, tmpId, todayStr } from "@/lib/view";
import type { PortalStore } from "./types";
import type { R } from "@/lib/store-types";

const METHODS = ["instapay", "vodafone_cash", "bank_transfer", "cash"] as const;
const tone: Record<string, string> = {
  due: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pending_review: "bg-blue-50 text-blue-800 ring-blue-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** كشف حساب الأتعاب والمدفوعات — العميل يسجل دفعات، والأدمن يضيف أتعاباً ويعتمد الدفعات */
export default function Billing({ store: s, rows, clientId }: { store: PortalStore; rows: R[]; clientId?: string }) {
  const { t, locale } = useI18n();
  const me = useMe();
  const p = t.portal;
  const staff = me.role !== "client";
  const [form, setForm] = useState<"charge" | "payment" | null>(null);

  const charges = rows.filter((r) => r.kind === "charge");
  const payments = rows.filter((r) => r.kind === "payment");
  const totalDue = charges.reduce((a, r) => a + Number(r.amount || 0), 0);
  const totalPaid = payments.filter((r) => r.status === "confirmed").reduce((a, r) => a + Number(r.amount || 0), 0);
  const pending = payments.filter((r) => r.status === "pending_review").reduce((a, r) => a + Number(r.amount || 0), 0);
  const balance = totalDue - totalPaid;
  const list = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.created_at.localeCompare(a.created_at));

  const setStatus = (id: string, status: string) =>
    void s.mutate({ apply: (d) => ({ ...d, BillingLedger: patchById(d.BillingLedger, id, { status }) }), run: () => setLedgerStatus(id, status), error: t.sync.saveFailed });
  const remove = (id: string) =>
    void s.mutate({ apply: (d) => ({ ...d, BillingLedger: removeById(d.BillingLedger, id) }), run: () => (isTmp(id) ? Promise.resolve({ ok: true }) : deleteLedger(id)), error: t.sync.saveFailed });

  return (
    <div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {[
          { label: p.totalDue, v: totalDue, c: "text-navy-900" },
          { label: p.totalPaid, v: totalPaid, c: "text-emerald-700", sub: pending ? `+ ${fmt(pending)} ${p.ledgerStatus.pending_review}` : "" },
          { label: p.balance, v: balance, c: balance > 0 ? "text-red-600" : "text-emerald-700" },
        ].map((x) => (
          <div key={x.label} className="rounded-xl bg-page p-4 ring-1 ring-slate-200">
            <div className={`ltr-num text-2xl font-bold ${x.c}`}>{fmt(x.v)}</div>
            <div className="text-xs text-slate-500">{x.label}</div>
            {x.sub && <div className="mt-1 text-[11px] text-blue-700">{x.sub}</div>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 px-5">
        {staff ? (
          <>
            <button onClick={() => setForm(form === "charge" ? null : "charge")} className="btn-navy">+ {p.addCharge}</button>
            <button onClick={() => setForm(form === "payment" ? null : "payment")} className="btn bg-emerald-600 text-white hover:bg-emerald-700">✓ {p.recordPayment}</button>
          </>
        ) : (
          <button onClick={() => setForm(form === "payment" ? null : "payment")} className="btn-gold">
            <Icon name="upload" className="h-4 w-4" /> {p.submitPayment}
          </button>
        )}
      </div>

      {form === "charge" && staff && clientId && (
        <ChargeForm
          onDone={() => setForm(null)}
          onSubmit={(f) => {
            const id = tmpId();
            setForm(null);
            void s.mutate({
              apply: (d) => ({ ...d, BillingLedger: [{ id, client_id: clientId, kind: "charge", ...f, created_at: nowIso() }, ...d.BillingLedger] }),
              run: () => addCharge(clientId, f),
              commit: (d, r) => (r.ok ? { ...d, BillingLedger: replaceById(d.BillingLedger, id, r.row) } : d),
              error: t.sync.saveFailed,
            });
          }}
        />
      )}
      {form === "payment" && (
        <PaymentForm
          staff={staff}
          onDone={() => setForm(null)}
          onSubmit={async (f, file) => {
            const input = { clientId, ...f };
            if (file) {
              // الإيصال يُرفع أولاً ثم تظهر الدفعة
              try {
                const tk = await getPortalTicket("receipt", clientId);
                const up = await uploadDirect(tk, file);
                const r = await submitPayment(input, tk.ticket, up);
                if (!r.ok) throw new Error();
                if (r.ticket) s.addTickets({ [r.row.receipt_file]: r.ticket });
                void s.mutate({ apply: (d) => ({ ...d, BillingLedger: [r.row, ...d.BillingLedger] }), run: async () => ({ ok: true }), success: staff ? undefined : p.paymentSent });
              } catch {
                s.toast(t.sync.saveFailed);
              }
            } else {
              const id = tmpId();
              void s.mutate({
                apply: (d) => ({ ...d, BillingLedger: [{ id, client_id: clientId ?? me.uid, kind: "payment", ...f, status: staff ? "confirmed" : "pending_review", created_at: nowIso() }, ...d.BillingLedger] }),
                run: () => submitPayment(input),
                commit: (d, r) => (r.ok ? { ...d, BillingLedger: replaceById(d.BillingLedger, id, r.row) } : d),
                error: t.sync.saveFailed,
                success: staff ? undefined : p.paymentSent,
              });
            }
            setForm(null);
          }}
        />
      )}

      {list.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-500">{p.noLedger}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-page text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{p.date}</th>
                <th className="px-4 py-3 text-start font-medium">{p.item}</th>
                <th className="px-4 py-3 text-end font-medium">{p.amount}</th>
                <th className="px-4 py-3 text-start font-medium">{p.status}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((r) => {
                const isPay = r.kind === "payment";
                return (
                  <tr key={r.id} className={isTmp(r.id) ? "opacity-60" : ""}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDate(r.date, locale)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{isPay ? `${p.payment} — ${p.methods[r.method as keyof typeof p.methods] ?? r.method}` : r.title}</div>
                      {r.note && <div className="text-xs text-slate-500">{r.note}</div>}
                    </td>
                    <td className={`ltr-num px-4 py-3 text-end font-semibold ${isPay ? "text-emerald-700" : "text-navy-900"}`}>{isPay ? "−" : ""}{fmt(Number(r.amount || 0))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone[r.status] ?? tone.due}`}>
                        {p.ledgerStatus[r.status as keyof typeof p.ledgerStatus] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {r.receipt_file && (
                          <button onClick={() => openDriveFile(s.url, s.ticket(r.receipt_file))} className="btn-outline px-2.5 py-1 text-xs">🧾 {p.viewReceipt}</button>
                        )}
                        {staff && isPay && r.status === "pending_review" && (
                          <>
                            <button onClick={() => setStatus(r.id, "confirmed")} className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">{p.approve}</button>
                            <button onClick={() => setStatus(r.id, "rejected")} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">{p.reject}</button>
                          </>
                        )}
                        {staff && !isPay && (
                          <button onClick={() => setStatus(r.id, r.status === "paid" ? "due" : "paid")} className="btn-outline px-2.5 py-1 text-xs">
                            {r.status === "paid" ? p.markDue : p.markPaid}
                          </button>
                        )}
                        {staff && (
                          <button onClick={() => remove(r.id)} className="rounded p-1 text-slate-300 hover:text-red-600"><Icon name="trash" className="h-4 w-4" /></button>
                        )}
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

function ChargeForm({ onSubmit, onDone }: { onSubmit: (f: { title: string; amount: string; date: string; status: string }) => void; onDone: () => void }) {
  const { t } = useI18n();
  const p = t.portal;
  const [f, setF] = useState({ title: "", amount: "", date: todayStr(), status: "due" });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.title.trim() || !(Number(f.amount) > 0)) return;
        onSubmit({ ...f, title: f.title.trim() });
      }}
      className="m-5 grid gap-3 rounded-xl bg-page p-4 ring-1 ring-slate-200 sm:grid-cols-4"
    >
      <input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={p.item} className="input sm:col-span-2" />
      <input required inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder={p.amount} className="input" dir="ltr" />
      <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="input" dir="ltr" />
      <div className="flex gap-2 sm:col-span-4">
        <button className="btn-navy">{t.ops.save}</button>
        <button type="button" onClick={onDone} className="btn-outline">{t.ops.cancel}</button>
      </div>
    </form>
  );
}

function PaymentForm({ staff, onSubmit, onDone }: { staff: boolean; onSubmit: (f: { amount: string; method: string; date: string; note: string }, file: File | null) => Promise<void>; onDone: () => void }) {
  const { t } = useI18n();
  const p = t.portal;
  const [f, setF] = useState({ amount: "", method: "instapay", date: todayStr(), note: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        if (!(Number(f.amount.replace(/,/g, "")) > 0)) return setErr(t.auth.errors.required);
        if (file && !checkFiles([file])) return setErr(t.dash.fileTypeDocs);
        setBusy(true);
        await onSubmit({ ...f, amount: f.amount.replace(/,/g, "") }, file);
        setBusy(false);
      }}
      className="m-5 grid gap-3 rounded-xl bg-emerald-50/50 p-4 ring-1 ring-emerald-200 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className="label">{p.method}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {METHODS.map((m) => (
            <button type="button" key={m} onClick={() => setF({ ...f, method: m })} className={`rounded-lg px-2 py-2.5 text-xs font-semibold ring-1 ${f.method === m ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200"}`}>
              {p.methods[m]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{p.amount}</label>
        <input required inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="input" dir="ltr" />
      </div>
      <div>
        <label className="label">{p.date}</label>
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="input" dir="ltr" />
      </div>
      {!staff || f.method !== "cash" ? (
        <div className="sm:col-span-2">
          <label className="label">{p.receipt}</label>
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
        </div>
      ) : null}
      <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={p.invoiceNote} className="input sm:col-span-2" />
      {err && <p className="text-sm text-red-600 sm:col-span-2">{err}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy} className="btn bg-emerald-600 text-white hover:bg-emerald-700">{busy ? "…" : t.ops.save}</button>
        <button type="button" onClick={onDone} className="btn-outline">{t.ops.cancel}</button>
      </div>
    </form>
  );
}
