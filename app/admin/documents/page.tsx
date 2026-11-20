import DocsPanel from "@/components/ops/DocsPanel";
import { Panel } from "@/components/ops/Panel";
import { requireStaff } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { loadWithClients, withNames, type DocRow } from "@/lib/ops";
import { downloadTicket } from "@/lib/tickets";
import { DOC_CATEGORIES } from "@/lib/i18n";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ client?: string; category?: string }> }) {
  await requireStaff();
  const { t, locale } = await getDict();
  const sp = await searchParams;
  const { rows, clients } = await loadWithClients<DocRow>("Documents");
  const list = withNames(rows, clients)
    .filter((d) => (!sp.client || d.client_id === sp.client) && (!sp.category || d.category === sp.category))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((d) => ({ ...d, ticket: downloadTicket(d.drive_file_id) }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.documents}</h1>
      <form className="flex flex-wrap gap-2" action="/admin/documents">
        <select name="client" defaultValue={sp.client ?? ""} className="input max-w-xs">
          <option value="">{t.ops.allClients}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className="input max-w-xs">
          <option value="">{t.ops.all}</option>
          {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{t.ops.docCats[c]}</option>)}
        </select>
        <button className="btn-outline">{t.admin.search}</button>
      </form>
      <Panel title={t.ops.nav.documents}>
        <DocsPanel t={t} locale={locale} rows={list} clients={clients} url={process.env.APPS_SCRIPT_URL!} />
      </Panel>
    </div>
  );
}
