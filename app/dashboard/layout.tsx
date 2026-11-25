import { redirect } from "next/navigation";
import ClientShell from "@/components/client/ClientShell";
import { ClientProvider } from "@/components/store/stores";
import { ClientSync } from "@/components/store/Syncs";
import { ClientSitePages } from "@/components/store/SitePages";
import { I18nProvider, MeProvider } from "@/components/store/I18n";
import { requireLogin } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { loadClientSnapshot } from "@/app/store-actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await requireLogin();
  if (s.role !== "client") redirect("/admin");
  const { t, locale, site } = await getDict();
  return (
    <I18nProvider t={t} locale={locale}>
      <MeProvider me={{ uid: s.uid, role: s.role, name: s.name }}>
        <ClientProvider cacheKey={`client:${s.uid}:v3`} loader={loadClientSnapshot}>
          <ClientSitePages initial={site.pages.filter((p) => p.is_active !== "no")}>
          <ClientShell userName={s.name} toolbar={<ClientSync />}>
            {children}
          </ClientShell>
          </ClientSitePages>
        </ClientProvider>
      </MeProvider>
    </I18nProvider>
  );
}
