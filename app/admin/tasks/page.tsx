import Link from "next/link";
import TasksPanel from "@/components/ops/TasksPanel";
import { Panel } from "@/components/ops/Panel";
import { requireStaff } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { loadWithClients, withNames, type TaskRow } from "@/lib/ops";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireStaff();
  const { t, locale } = await getDict();
  const view = (await searchParams).view === "done" ? "done" : "open";
  const { rows, clients } = await loadWithClients<TaskRow>("Tasks");
  const prio: Record<string, number> = { high: 0, normal: 1, low: 2 };
  const list = withNames(rows, clients)
    .filter((r) => (view === "done" ? r.status === "done" : r.status !== "done"))
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999") || (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.tasks}</h1>
        <a href="/admin/export/tasks" className="btn-outline">⬇ {t.ops.exportCsv}</a>
      </div>
      <div className="flex gap-2">
        {(["open", "done"] as const).map((v) => (
          <Link key={v} href={`/admin/tasks?view=${v}`} className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${view === v ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200"}`}>
            {t.ops.taskStatus[v]} ({rows.filter((r) => (v === "done" ? r.status === "done" : r.status !== "done")).length})
          </Link>
        ))}
      </div>
      <Panel title={t.ops.nav.tasks}>
        <TasksPanel t={t} locale={locale} rows={list} clients={clients} />
      </Panel>
    </div>
  );
}
