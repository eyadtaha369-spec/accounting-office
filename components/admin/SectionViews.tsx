"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import RecordsPanel, { type RecordView } from "@/components/ops/RecordsPanel";
import TasksPanel, { type TaskView } from "@/components/ops/TasksPanel";
import FinancePanel, { type FinanceView } from "@/components/ops/FinancePanel";
import DocsPanel, { type DocView } from "@/components/ops/DocsPanel";
import { Panel } from "@/components/ops/Panel";
import { Icon } from "@/components/Icons";
import { useAdmin } from "@/components/store/stores";
import { useI18n, useMe } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { DOC_CATEGORIES, RECORD_SERVICES } from "@/lib/i18n";
import { clientOptions, desc, dueAsc, withNames } from "@/lib/view";
import { exportCsv } from "./exports";

const chip = (on: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 ${on ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"}`;

// ---------------- سجلات الخدمات ----------------
export function RecordsView() {
  const s = useAdmin();
  const { t, locale } = useI18n();
  const sp = useSearchParams();
  const init = sp.get("service") ?? "";
  const [service, setService] = useState((RECORD_SERVICES as readonly string[]).includes(init) ? init : "");
  const [client, setClient] = useState(sp.get("client") ?? "");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.records}</h1>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ key: "", label: t.ops.all }, ...RECORD_SERVICES.map((x) => ({ key: x, label: t.ops.services[x] }))].map((tab) => (
          <button key={tab.key} onClick={() => setService(tab.key)} className={chip(service === tab.key)}>{tab.label}</button>
        ))}
      </div>
      <Guard s={s}>
        {(d) => {
          const options = clientOptions(d.Users);
          const rows = withNames(d.ServiceRecords, d.Users)
            .filter((r) => (!service || r.service === service) && (!client || r.client_id === client))
            .sort(dueAsc) as unknown as RecordView[];
          return (
            <>
              <div className="flex flex-wrap gap-2">
                <select value={client} onChange={(e) => setClient(e.target.value)} className="input max-w-sm">
                  <option value="">{t.ops.allClients}</option>
                  {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => exportCsv("records", d, t, service)} className="btn-outline ms-auto">⬇ {t.ops.exportCsv}</button>
              </div>
              <Panel title={service ? t.ops.services[service as keyof typeof t.ops.services] : t.ops.nav.records} hint={t.ops.recordsHint}>
                <RecordsPanel t={t} locale={locale} rows={rows} clients={options} service={service} />
              </Panel>
            </>
          );
        }}
      </Guard>
    </div>
  );
}

// ---------------- المهام ----------------
export function TasksView() {
  const s = useAdmin();
  const { t, locale } = useI18n();
  const [view, setView] = useState<"open" | "done">(useSearchParams().get("view") === "done" ? "done" : "open");
  const prio: Record<string, number> = { high: 0, normal: 1, low: 2 };
  return (
    <Guard s={s}>
      {(d) => {
        const all = withNames(d.Tasks, d.Users);
        const list = all
          .filter((r) => (view === "done" ? r.status === "done" : r.status !== "done"))
          .sort((a, b) => dueAsc(a, b) || (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1)) as unknown as TaskView[];
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.tasks}</h1>
              <button onClick={() => exportCsv("tasks", d, t)} className="btn-outline">⬇ {t.ops.exportCsv}</button>
            </div>
            <div className="flex gap-2">
              {(["open", "done"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={chip(view === v)}>
                  {t.ops.taskStatus[v]} ({all.filter((r) => (v === "done" ? r.status === "done" : r.status !== "done")).length})
                </button>
              ))}
            </div>
            <Panel title={t.ops.nav.tasks}>
              <TasksPanel t={t} locale={locale} rows={list} clients={clientOptions(d.Users)} />
            </Panel>
          </div>
        );
      }}
    </Guard>
  );
}

// ---------------- الحسابات المالية ----------------
export function FinanceView() {
  const s = useAdmin();
  const me = useMe();
  const { t, locale } = useI18n();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  if (me.role !== "admin") return <div className="card p-10 text-center text-slate-600">🔒 {t.ops.adminOnly}</div>;
  return (
    <Guard s={s}>
      {(d) => {
        const list = withNames(d.Finance, d.Users).filter((r) => r.date?.startsWith(month)).sort(desc("date")) as unknown as FinanceView[];
        const income = list.filter((r) => r.type === "income").reduce((a, r) => a + Number(r.amount || 0), 0);
        const expense = list.filter((r) => r.type === "expense").reduce((a, r) => a + Number(r.amount || 0), 0);
        const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
        const label = /^\d{4}-\d{2}$/.test(month)
          ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`))
          : "";
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.finance}</h1>
              <div className="flex gap-2">
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input" dir="ltr" />
                <button onClick={() => exportCsv("finance", d, t)} className="btn-outline">⬇ CSV</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: t.ops.totalIncome, v: income, tone: "text-emerald-700", icon: "up" as const },
                { label: t.ops.totalExpense, v: expense, tone: "text-red-600", icon: "down" as const },
                { label: `${t.ops.net} — ${label}`, v: income - expense, tone: income - expense >= 0 ? "text-navy-900" : "text-red-600", icon: "wallet" as const },
              ].map((c) => (
                <div key={c.label} className="card flex items-center gap-4 p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-page text-gold-600"><Icon name={c.icon} /></div>
                  <div>
                    <div className={`ltr-num text-2xl font-bold ${c.tone}`}>{fmt(c.v)}</div>
                    <div className="text-xs text-slate-500">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <Panel title={label}>
              <FinancePanel t={t} locale={locale} rows={list} clients={clientOptions(d.Users)} />
            </Panel>
          </div>
        );
      }}
    </Guard>
  );
}

// ---------------- أرشيف المستندات ----------------
export function DocumentsView() {
  const s = useAdmin();
  const { t, locale } = useI18n();
  const [client, setClient] = useState("");
  const [category, setCategory] = useState("");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.documents}</h1>
      <Guard s={s}>
        {(d) => {
          const options = clientOptions(d.Users);
          const list = withNames(d.Documents, d.Users)
            .filter((x) => (!client || x.client_id === client) && (!category || x.category === category))
            .sort(desc())
            .map((x) => ({ ...x, ticket: s.ticket(x.drive_file_id) })) as unknown as DocView[];
          return (
            <>
              <div className="flex flex-wrap gap-2">
                <select value={client} onChange={(e) => setClient(e.target.value)} className="input max-w-xs">
                  <option value="">{t.ops.allClients}</option>
                  {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-xs">
                  <option value="">{t.ops.all}</option>
                  {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{t.ops.docCats[c]}</option>)}
                </select>
              </div>
              <Panel title={t.ops.nav.documents}>
                <DocsPanel t={t} locale={locale} rows={list} clients={options} url={s.url} />
              </Panel>
            </>
          );
        }}
      </Guard>
    </div>
  );
}

// ---------------- التقارير ----------------
export function ReportsView() {
  const s = useAdmin();
  const me = useMe();
  const { t } = useI18n();
  const o = t.ops;
  const kinds = (["clients", "requests", "records", "tasks", "finance"] as const).filter((k) => k !== "finance" || me.role === "admin");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{o.nav.reports}</h1>
        <p className="mt-1 text-sm text-slate-500">{o.reportsHint}</p>
      </div>
      <Guard s={s}>
        {(d) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kinds.map((k) => (
                <button key={k} onClick={() => exportCsv(k, d, t)} className="card group flex items-center gap-4 p-5 text-start transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-gold-400"><Icon name="report" className="h-6 w-6" /></div>
                  <div className="flex-1">
                    <div className="font-bold text-navy-900">{o.reportKinds[k]}</div>
                    <div className="text-xs text-slate-500">{o.exportCsv}</div>
                  </div>
                  <Icon name="download" className="h-5 w-5 text-slate-400 group-hover:text-gold-600" />
                </button>
              ))}
            </div>
            <div className="card p-5">
              <h2 className="mb-3 font-bold text-navy-900">{o.nav.records}</h2>
              <div className="flex flex-wrap gap-2">
                {RECORD_SERVICES.map((sv) => (
                  <button key={sv} onClick={() => exportCsv("records", d, t, sv)} className="btn-outline">⬇ {o.services[sv]}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </Guard>
    </div>
  );
}
