import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { ClientProvider } from "@/components/store/stores";
import { ClientSync } from "@/components/store/Syncs";
import { I18nProvider, MeProvider } from "@/components/store/I18n";
import { requireLogin } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { loadClientSnapshot } from "@/app/store-actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await requireLogin();
  if (s.role !== "client") redirect("/admin");
  const { t, locale } = await getDict();
  return (
    <I18nProvider t={t} locale={locale}>
      <MeProvider me={{ uid: s.uid, role: s.role, name: s.name }}>
        <ClientProvider cacheKey={`client:${s.uid}:v1`} loader={loadClientSnapshot}>
          <AppShell
            t={t}
            locale={locale}
            userName={s.name}
            roleLabel={t.dash.myRequests}
            toolbar={<ClientSync />}
            items={[
              { href: "/dashboard", label: t.dash.myRequests, icon: "list", exact: true },
              { href: "/dashboard/new", label: t.dash.newRequest, icon: "plus" },
              { href: "/dashboard/invoices", label: t.portal.invoicesTitle, icon: "receipt" },
              { href: "/dashboard/billing", label: t.portal.billingTitle, icon: "wallet" },
              { href: "/dashboard/profile", label: t.dash.profile, icon: "user" },
            ]}
          >
            {children}
          </AppShell>
        </ClientProvider>
      </MeProvider>
    </I18nProvider>
  );
}
