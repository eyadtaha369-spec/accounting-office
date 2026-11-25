import { redirect } from "next/navigation";
import ClientShell from "@/components/client/ClientShell";
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
        <ClientProvider cacheKey={`client:${s.uid}:v2`} loader={loadClientSnapshot}>
          <ClientShell userName={s.name} toolbar={<ClientSync />}>
            {children}
          </ClientShell>
        </ClientProvider>
      </MeProvider>
    </I18nProvider>
  );
}
