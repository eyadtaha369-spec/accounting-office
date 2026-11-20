import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireLogin } from "@/lib/auth";
import { getDict } from "@/lib/locale";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await requireLogin();
  if (s.role !== "client") redirect("/admin");
  const { t, locale } = await getDict();
  return (
    <AppShell
      t={t}
      locale={locale}
      userName={s.name}
      roleLabel={t.dash.myRequests}
      items={[
        { href: "/dashboard", label: t.dash.myRequests, icon: "list", exact: true },
        { href: "/dashboard/new", label: t.dash.newRequest, icon: "plus" },
        { href: "/dashboard/profile", label: t.dash.profile, icon: "user" },
      ]}
    >
      {children}
    </AppShell>
  );
}
