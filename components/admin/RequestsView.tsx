"use client";
import { useSearchParams, useRouter } from "next/navigation";
import RequestsTable, { type AdminRequestRow } from "@/components/RequestsTable";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { STATUSES, type Status } from "@/lib/i18n";
import { desc } from "@/lib/view";

export default function RequestsView() {
  const s = useAdmin();
  const { t, locale } = useI18n();
  const sp = useSearchParams();
  const router = useRouter();
  const raw = sp.get("status") ?? "";
  const status = (STATUSES as readonly string[]).includes(raw) ? (raw as Status) : null;
  // الفلترة محلية — تغيير الرابط فقط بدون أي اتصال بالشيت
  const setStatus = (st: Status | null) => router.replace(st ? `/admin/requests?status=${st}` : "/admin/requests", { scroll: false });
  const tabs: { key: Status | null; label: string }[] = [{ key: null, label: t.admin.allRequests }, ...STATUSES.map((x) => ({ key: x, label: t.status[x] }))];

  return (
    <Guard s={s}>
      {(d) => {
        const users = new Map(d.Users.map((u) => [u.id, u]));
        const rows = d.Requests.filter((r) => !status || r.status === status)
          .sort(desc())
          .map((r) => {
            const c = users.get(r.client_id);
            return { ...r, client: c ? { id: c.id, full_name: c.full_name, phone: c.phone } : null };
          });
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-navy-900">{t.admin.allRequests}</h1>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {tabs.map((tab) => {
                const n = tab.key ? d.Requests.filter((r) => r.status === tab.key).length : d.Requests.length;
                return (
                  <button key={tab.label} onClick={() => setStatus(tab.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 ${status === tab.key ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"}`}>
                    {tab.label} <span className="opacity-60">({n})</span>
                  </button>
                );
              })}
            </div>
            <section className="card overflow-hidden">
              <RequestsTable rows={rows as unknown as AdminRequestRow[]} t={t} locale={locale} showCompleted empty={t.admin.noResults} />
            </section>
          </div>
        );
      }}
    </Guard>
  );
}
