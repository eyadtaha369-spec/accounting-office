import Link from "next/link";
import RequestsTable from "@/components/RequestsTable";
import AutoRefresh from "@/components/AutoRefresh";
import TasksPanel from "@/components/ops/TasksPanel";
import { Panel } from "@/components/ops/Panel";
import { Icon, icons } from "@/components/Icons";
import { requireStaff } from "@/lib/auth";
import { withClients, type Request } from "@/lib/db";
import { dashboardData, num, withNames } from "@/lib/ops";
import { getDict } from "@/lib/locale";
import { fmtDate } from "@/lib/format";
import { OPEN_STATUSES } from "@/lib/i18n";

export default async function AdminHome() {
  const s = await requireStaff();
  const { t, locale } = await getDict();
  const o = t.ops;
  const { clients, requests: rawRequests, tasks, finance } = await dashboardData();
  const requests = rawRequests as unknown as Request[];
  const isAdmin = s.role === "admin";

  const active = requests.filter((r) => OPEN_STATUSES.includes(r.status)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const month = new Date().toISOString().slice(0, 7);
  const monthRows = finance.filter((f) => f.date.startsWith(month));
  const net = monthRows.reduce((a, f) => a + (f.type === "income" ? num(f.amount) : -num(f.amount)), 0);
  const options = clients.map((c) => ({ id: c.id, name: c.full_name }));
  const upcoming = withNames(tasks, options)
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
    .slice(0, 6);
  const latest = [...clients].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  const cards = [
    { label: t.admin.stats.clients, value: clients.length, icon: "users" as const, tone: "bg-navy-900 text-gold-400", href: "/admin/clients" },
    { label: t.admin.stats.pending, value: requests.filter((r) => r.status === "pending_review").length, icon: "clock" as const, tone: "bg-amber-100 text-amber-700", href: "/admin/requests?status=pending_review" },
    { label: t.admin.stats.open, value: active.length, icon: "pulse" as const, tone: "bg-blue-100 text-blue-700", href: "/admin/requests" },
    { label: t.admin.stats.done, value: requests.filter((r) => r.status === "completed").length, icon: "check" as const, tone: "bg-emerald-100 text-emerald-700", href: "/admin/requests?status=completed" },
    { label: o.openTasks, value: tasks.length, icon: "tasks" as const, tone: "bg-violet-100 text-violet-700", href: "/admin/tasks" },
    ...(isAdmin
      ? [{ label: o.monthNet, value: net.toLocaleString("en-US", { maximumFractionDigits: 0 }), icon: "wallet" as const, tone: net >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700", href: "/admin/finance" }]
      : []),
  ];

  const quick: { href: string; label: string; icon: keyof typeof icons }[] = [
    { href: "/admin/clients/new", label: t.admin.addClient, icon: "plus" },
    { href: "/admin/records?service=vat", label: o.services.vat, icon: "percent" },
    { href: "/admin/records?service=income", label: o.services.income, icon: "landmark" },
    { href: "/admin/records?service=payroll", label: o.services.payroll, icon: "users" },
    { href: "/admin/records?service=einvoice", label: o.services.einvoice, icon: "receipt" },
    { href: "/admin/records?service=audit", label: o.services.audit, icon: "search" },
    { href: "/admin/records?service=formation", label: o.services.formation, icon: "building" },
    { href: "/admin/documents", label: o.nav.documents, icon: "archive" },
    { href: "/admin/reports", label: o.nav.reports, icon: "report" },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={45} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">{t.admin.title}</h1>
        <Link href="/admin/clients/new" className="btn-gold">+ {t.admin.addClient}</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card flex items-center gap-3 p-4 transition hover:shadow-md">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.tone}`}>
              <Icon name={c.icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="ltr-num text-xl font-bold text-navy-900">{c.value}</div>
              <div className="truncate text-xs text-slate-500">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <Panel title={t.admin.active} hint={t.admin.activeHint}>
        <RequestsTable rows={withClients(active, clients)} t={t} locale={locale} empty={t.admin.noActive} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={o.upcomingTasks} action={<Link href="/admin/tasks" className="text-sm font-semibold text-navy-700 hover:text-gold-600">{o.viewAll}</Link>}>
          <TasksPanel t={t} locale={locale} rows={upcoming} clients={options} compact />
        </Panel>
        <Panel title={o.latestClients} action={<Link href="/admin/clients" className="text-sm font-semibold text-navy-700 hover:text-gold-600">{o.viewAll}</Link>}>
          {latest.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">{t.admin.noResults}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {latest.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-page">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-sm font-bold text-gold-400">{c.full_name.trim().charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-navy-900">{c.full_name}</div>
                      <div className="truncate text-xs text-slate-500">{c.company_name || t.clientTypes[c.client_type as keyof typeof t.clientTypes]}</div>
                    </div>
                    <span className="text-xs text-slate-400">{fmtDate(c.created_at, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title={o.quickAccess}>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-5">
          {quick.map((q) => (
            <Link key={q.href} href={q.href} className="flex flex-col items-center gap-2 rounded-xl bg-page p-4 text-center text-sm font-medium text-navy-900 ring-1 ring-slate-200 transition hover:bg-white hover:ring-gold-500">
              <Icon name={q.icon} className="h-6 w-6 text-gold-600" />
              {q.label}
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
