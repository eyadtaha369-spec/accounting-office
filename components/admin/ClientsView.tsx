"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { fmtDate } from "@/lib/format";
import { clients, desc, searchClients } from "@/lib/view";

export default function ClientsView() {
  const s = useAdmin();
  const { t, locale } = useI18n();
  const [q, setQ] = useState(useSearchParams().get("q") ?? "");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">{t.admin.clients}</h1>
        <Link href="/admin/clients/new" className="btn-gold">+ {t.admin.addClient}</Link>
      </div>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        {/* بحث فوري أثناء الكتابة — بدون أي طلب للشيت */}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.admin.searchPlaceholder} className="input ps-10" autoFocus />
      </div>
      <Guard s={s}>
        {(d) => {
          const list = searchClients(clients(d.Users).sort(desc()), q).slice(0, 200);
          return (
            <section className="card overflow-hidden">
              {!list.length ? (
                <p className="p-10 text-center text-sm text-slate-500">{t.admin.noResults}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {list.map((c) => (
                    <li key={c.id}>
                      <Link href={`/admin/clients/${c.id}`} className="flex flex-col gap-2 p-4 transition hover:bg-page sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-sm font-bold text-gold-400">{c.full_name?.trim().charAt(0)}</div>
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
          );
        }}
      </Guard>
    </div>
  );
}
