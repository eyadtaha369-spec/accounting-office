import AppShell from "@/components/AppShell";
import { requireStaff } from "@/lib/auth";
import { getDict } from "@/lib/locale";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireStaff();
  const { t, locale } = await getDict();
  return (
    <AppShell
      t={t}
      locale={locale}
      userName={s.name}
      roleLabel={s.role === "admin" ? "Admin" : "Staff"}
      items={[
        { href: "/admin", label: t.admin.title, icon: "grid", exact: true },
        { href: "/admin/requests", label: t.admin.allRequests, icon: "list" },
        { href: "/admin/clients", label: t.admin.clients, icon: "users" },
        { href: "/admin/records", label: t.ops.nav.records, icon: "records" },
        { href: "/admin/tasks", label: t.ops.nav.tasks, icon: "tasks" },
        ...(s.role === "admin" ? [{ href: "/admin/finance", label: t.ops.nav.finance, icon: "wallet" as const }] : []),
        { href: "/admin/documents", label: t.ops.nav.documents, icon: "archive" },
        { href: "/admin/reports", label: t.ops.nav.reports, icon: "report" },
      ]}
    >
      {children}
    </AppShell>
  );
}
