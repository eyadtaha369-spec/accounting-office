import { Icon } from "@/components/Icons";
import { requireStaff } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { RECORD_SERVICES } from "@/lib/i18n";

export default async function ReportsPage() {
  const s = await requireStaff();
  const { t } = await getDict();
  const o = t.ops;
  const kinds = (["clients", "requests", "records", "tasks", "finance"] as const).filter((k) => k !== "finance" || s.role === "admin");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{o.nav.reports}</h1>
        <p className="mt-1 text-sm text-slate-500">{o.reportsHint}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kinds.map((k) => (
          <a key={k} href={`/admin/export/${k}`} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-gold-400"><Icon name="report" className="h-6 w-6" /></div>
            <div className="flex-1">
              <div className="font-bold text-navy-900">{o.reportKinds[k]}</div>
              <div className="text-xs text-slate-500">{o.exportCsv}</div>
            </div>
            <Icon name="download" className="h-5 w-5 text-slate-400 group-hover:text-gold-600" />
          </a>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="mb-3 font-bold text-navy-900">{o.nav.records}</h2>
        <div className="flex flex-wrap gap-2">
          {RECORD_SERVICES.map((sv) => (
            <a key={sv} href={`/admin/export/records?service=${sv}`} className="btn-outline">⬇ {o.services[sv]}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
