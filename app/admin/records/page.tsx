import Link from "next/link";
import RecordsPanel from "@/components/ops/RecordsPanel";
import { Panel } from "@/components/ops/Panel";
import { requireStaff } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { loadWithClients, withNames, type RecordRow } from "@/lib/ops";
import { RECORD_SERVICES } from "@/lib/i18n";

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ service?: string; client?: string; status?: string }> }) {
  await requireStaff();
  const { t, locale } = await getDict();
  const sp = await searchParams;
  const service = (RECORD_SERVICES as readonly string[]).includes(sp.service ?? "") ? sp.service! : "";
  const { rows, clients } = await loadWithClients<RecordRow>("ServiceRecords");
  const filtered = withNames(rows, clients)
    .filter((r) => (!service || r.service === service) && (!sp.client || r.client_id === sp.client))
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));

  const tabs = [{ key: "", label: t.ops.all }, ...RECORD_SERVICES.map((s) => ({ key: s, label: t.ops.services[s] }))];
  const qs = (k: string) => `/admin/records?${new URLSearchParams({ ...(k ? { service: k } : {}), ...(sp.client ? { client: sp.client } : {}) })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.records}</h1>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => (
          <Link key={tab.key} href={qs(tab.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 ${service === tab.key ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"}`}>
            {tab.label}
          </Link>
        ))}
      </div>
      <form className="flex flex-wrap gap-2" action="/admin/records">
        {service && <input type="hidden" name="service" value={service} />}
        <select name="client" defaultValue={sp.client ?? ""} className="input max-w-sm">
          <option value="">{t.ops.allClients}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-outline">{t.admin.search}</button>
        <a href={`/admin/export/records${service ? `?service=${service}` : ""}`} className="btn-outline ms-auto">⬇ {t.ops.exportCsv}</a>
      </form>
      <Panel title={service ? t.ops.services[service as keyof typeof t.ops.services] : t.ops.nav.records} hint={t.ops.recordsHint}>
        <RecordsPanel t={t} locale={locale} rows={filtered} clients={clients} service={service} />
      </Panel>
    </div>
  );
}
