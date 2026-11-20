import RequestsTable from "@/components/RequestsTable";
import AutoRefresh from "@/components/AutoRefresh";
import { Icon } from "@/components/Icons";
import { requireStaff } from "@/lib/auth";
import { adminOverview, withClients } from "@/lib/db";
import { getDict } from "@/lib/locale";
import { OPEN_STATUSES } from "@/lib/i18n";

export default async function AdminHome() {
  await requireStaff();
  const { t, locale } = await getDict();
  const { clients, requests } = await adminOverview();

  const active = requests.filter((r) => OPEN_STATUSES.includes(r.status)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const cards = [
    { label: t.admin.stats.clients, value: clients.length, icon: "users" as const, tone: "bg-navy-900 text-gold-400" },
    { label: t.admin.stats.open, value: active.length, icon: "pulse" as const, tone: "bg-blue-100 text-blue-700" },
    { label: t.admin.stats.pending, value: requests.filter((r) => r.status === "pending_review").length, icon: "clock" as const, tone: "bg-amber-100 text-amber-700" },
    { label: t.admin.stats.done, value: requests.filter((r) => r.status === "completed").length, icon: "check" as const, tone: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={45} />
      <h1 className="text-2xl font-bold text-navy-900">{t.admin.title}</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4 p-4 sm:p-5">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.tone}`}>
              <Icon name={c.icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-navy-900">{c.value}</div>
              <div className="truncate text-xs text-slate-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-navy-900">{t.admin.active}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t.admin.activeHint}</p>
        </div>
        <RequestsTable rows={withClients(active, clients)} t={t} locale={locale} empty={t.admin.noActive} />
      </section>
    </div>
  );
}
