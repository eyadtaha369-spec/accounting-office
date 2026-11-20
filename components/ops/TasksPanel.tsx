"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TASK_PRIORITIES, type Dict, type Locale } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { saveTask, setTaskStatus, deleteTask } from "@/app/admin/ops-actions";
import DeleteButton from "./DeleteButton";
import { Empty, Pill } from "./Panel";
import { Icon } from "../Icons";

export type TaskView = { id: string; title: string; client_id: string; clientName: string; due_date: string; priority: string; status: string; assigned_to: string; notes: string };
type Opt = { id: string; name: string };
const PRIO_STYLE: Record<string, string> = {
  high: "bg-red-50 text-red-700 ring-red-200",
  normal: "bg-slate-100 text-slate-700 ring-slate-200",
  low: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default function TasksPanel({ t, locale, rows, clients, lockedClientId = "", compact = false }: {
  t: Dict; locale: Locale; rows: TaskView[]; clients: Opt[]; lockedClientId?: string; compact?: boolean;
}) {
  const o = t.ops;
  const router = useRouter();
  const blank = { id: "", title: "", client_id: lockedClientId, due_date: "", priority: "normal", assigned_to: "", notes: "" };
  const [form, setForm] = useState<typeof blank | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const set = (k: string, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    const r = await saveTask(form);
    setBusy(false);
    if (r.ok) {
      setForm(null);
      router.refresh();
    }
  }

  return (
    <div>
      {!compact && (
        <div className="flex justify-end px-5 pt-4">
          {!form && (
            <button onClick={() => setForm(blank)} className="btn-gold">
              <Icon name="plus" className="h-4 w-4" /> {o.add}
            </button>
          )}
        </div>
      )}
      {form && (
        <form onSubmit={submit} className="m-5 grid gap-4 rounded-xl bg-page p-4 ring-1 ring-slate-200 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">{o.title}</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} className="input" />
          </div>
          {!lockedClientId && (
            <div>
              <label className="label">{o.client}</label>
              <select value={form.client_id} onChange={(e) => set("client_id", e.target.value)} className="input">
                <option value="">{o.noClient}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{o.dueDate}</label>
            <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">{o.priority}</label>
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="input">
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{o.prio[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{o.assignedTo}</label>
            <input value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{o.notes}</label>
            <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className="input" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className="btn-navy">{busy ? t.common.loading : o.save}</button>
            <button type="button" onClick={() => setForm(null)} className="btn-outline">{o.cancel}</button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <Empty text={o.noData} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => {
            const done = r.status === "done";
            const overdue = !done && r.due_date && r.due_date < today;
            const isToday = !done && r.due_date === today;
            return (
              <li key={r.id} className={`flex items-start gap-3 px-5 py-3.5 ${done ? "opacity-60" : ""}`}>
                <button
                  disabled={pending}
                  onClick={() => start(async () => { await setTaskStatus(r.id, !done); router.refresh(); })}
                  title={done ? o.reopen : o.markDone}
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-navy-600"}`}
                >
                  {done && <Icon name="check" className="h-3.5 w-3.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium text-slate-800 ${done ? "line-through" : ""}`}>{r.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {r.due_date && (
                      <span className={overdue ? "font-semibold text-red-600" : isToday ? "font-semibold text-orange-600" : ""}>
                        {overdue ? `${o.overdue} · ` : isToday ? `${o.dueToday} · ` : ""}{fmtDate(r.due_date, locale)}
                      </span>
                    )}
                    {!lockedClientId && r.client_id && (
                      <Link href={`/admin/clients/${r.client_id}`} className="text-navy-700 hover:text-gold-600">{r.clientName}</Link>
                    )}
                    {r.assigned_to && <span>👤 {r.assigned_to}</span>}
                    {r.notes && <span className="truncate">{r.notes}</span>}
                  </div>
                </div>
                <Pill className={PRIO_STYLE[r.priority] ?? PRIO_STYLE.normal}>{o.prio[r.priority as keyof typeof o.prio] ?? r.priority}</Pill>
                {!compact && (
                  <div className="flex items-center">
                    <button onClick={() => setForm({ ...r })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-700" title={o.edit}>
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                    <DeleteButton onDelete={() => deleteTask(r.id)} label={o.delete} confirm={o.confirmDelete} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
