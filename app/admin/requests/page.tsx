import Link from "next/link";
import RequestsTable from "@/components/RequestsTable";
import { requireStaff } from "@/lib/auth";
import { adminOverview, withClients } from "@/lib/db";
import { getDict } from "@/lib/locale";
import { STATUSES, type Status } from "@/lib/i18n";

export default async function AllRequests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff();
  const { t, locale } = await getDict();
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as Status) : null;

  const { clients, requests } = await adminOverview();
  const rows = requests
    .filter((r) => !status || r.status === status)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 300);

  const tabs: { key: Status | null; label: string }[] = [{ key: null, label: t.admin.allRequests }, ...STATUSES.map((s) => ({ key: s, label: t.status[s] }))];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.admin.allRequests}</h1>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.key ? `/admin/requests?status=${tab.key}` : "/admin/requests"}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 ${
              status === tab.key ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <section className="card overflow-hidden">
        <RequestsTable rows={withClients(rows, clients)} t={t} locale={locale} showCompleted empty={t.admin.noResults} />
      </section>
    </div>
  );
}
