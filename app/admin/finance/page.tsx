import FinancePanel from "@/components/ops/FinancePanel";
import { Panel } from "@/components/ops/Panel";
import { Icon } from "@/components/Icons";
import { requireStaff } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { loadWithClients, num, withNames, type FinanceRow } from "@/lib/ops";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const s = await requireStaff();
  const { t, locale } = await getDict();
  if (s.role !== "admin") {
    return <div className="card p-10 text-center text-slate-600">🔒 {t.ops.adminOnly}</div>;
  }
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? sp.m! : new Date().toISOString().slice(0, 7);
  const { rows, clients } = await loadWithClients<FinanceRow>("Finance");
  const list = withNames(rows, clients).filter((r) => r.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const income = list.filter((r) => r.type === "income").reduce((a, r) => a + num(r.amount), 0);
  const expense = list.filter((r) => r.type === "expense").reduce((a, r) => a + num(r.amount), 0);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const monthLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">{t.ops.nav.finance}</h1>
        <form className="flex gap-2" action="/admin/finance">
          <input type="month" name="m" defaultValue={month} className="input" dir="ltr" />
          <button className="btn-outline">{t.admin.search}</button>
          <a href="/admin/export/finance" className="btn-outline">⬇ CSV</a>
        </form>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: t.ops.totalIncome, v: income, tone: "text-emerald-700", icon: "up" as const },
          { label: t.ops.totalExpense, v: expense, tone: "text-red-600", icon: "down" as const },
          { label: `${t.ops.net} — ${monthLabel}`, v: income - expense, tone: income - expense >= 0 ? "text-navy-900" : "text-red-600", icon: "wallet" as const },
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
      <Panel title={monthLabel}>
        <FinancePanel t={t} locale={locale} rows={list} clients={clients} />
      </Panel>
    </div>
  );
}
