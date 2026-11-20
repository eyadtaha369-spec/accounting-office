import Link from "next/link";
import { Icon } from "@/components/Icons";
import { requireStaff } from "@/lib/auth";
import { select } from "@/lib/sheets";
import { toProfile } from "@/lib/db";
import { getDict } from "@/lib/locale";
import { fmtDate } from "@/lib/format";
import { normalizeDigits } from "@/lib/validation";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const { t, locale } = await getDict();
  const sp = await searchParams;
  const raw = (sp.q ?? "").trim().slice(0, 80);
  const q = raw.toLowerCase();
  const digits = normalizeDigits(raw);

  const all = (await select("Users", { role: "client" })).map(toProfile).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const clients = (
    q
      ? all.filter((c) =>
          [c.full_name, c.company_name, c.email].some((v) => v?.toLowerCase().includes(q)) ||
          (/^[0-9]+$/.test(digits) && [c.phone, c.phone_alt, c.national_id, c.tax_registration_number].some((v) => v?.includes(digits)))
        )
      : all
  ).slice(0, 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">{t.admin.clients}</h1>
        <Link href="/admin/clients/new" className="btn-gold">+ {t.admin.addClient}</Link>
      </div>
      <form className="flex gap-2" action="/admin/clients">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={raw} placeholder={t.admin.searchPlaceholder} className="input ps-10" autoFocus />
        </div>
        <button className="btn-navy">{t.admin.search}</button>
      </form>

      <section className="card overflow-hidden">
        {!clients?.length ? (
          <p className="p-10 text-center text-sm text-slate-500">{t.admin.noResults}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {clients.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/clients/${c.id}`} className="flex flex-col gap-2 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-sm font-bold text-gold-400">
                      {c.full_name.trim().charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-navy-900">{c.full_name}</div>
                      {c.company_name && <div className="text-xs text-slate-500">{c.company_name}</div>}
                    </div>
                  </div>
                  <div className="ltr-num flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 sm:text-sm">
                    <span>📞 {c.phone}</span>
                    <span>🪪 {c.national_id}</span>
                    {c.tax_registration_number && <span>🧾 {c.tax_registration_number}</span>}
                    <span className="text-slate-400">{fmtDate(c.created_at, locale)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
