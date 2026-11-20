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
      ]}
    >
      {children}
    </AppShell>
  );
}
