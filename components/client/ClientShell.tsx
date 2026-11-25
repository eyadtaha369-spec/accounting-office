"use client";
import AppShell, { type NavItem } from "@/components/AppShell";
import { useClient } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { parseServices } from "@/lib/services";
import { SERVICE_ICON } from "@/components/portal/serviceIcons";

/** القائمة تُبنى من الخدمات المفعلة للعميل فقط */
export default function ClientShell({ userName, toolbar, children }: { userName: string; toolbar: React.ReactNode; children: React.ReactNode }) {
  const s = useClient();
  const { t, locale } = useI18n();
  const services = parseServices(s.data?.Me?.services);
  const items: NavItem[] = [
    { href: "/dashboard", label: t.arch.home, icon: "grid", exact: true },
    ...services.map((k) => ({ href: `/dashboard/services/${k}`, label: t.arch.svc[k], icon: SERVICE_ICON[k] })),
    { href: "/dashboard/archive", label: t.arch.myArchive, icon: "archive" },
    { href: "/dashboard/billing", label: t.portal.billingTitle, icon: "wallet" },
    { href: "/dashboard/profile", label: t.arch.myFile, icon: "user" },
  ];
  return (
    <AppShell t={t} locale={locale} userName={userName} roleLabel={s.data?.Me?.company_name || t.arch.myFile} toolbar={toolbar} items={items}>
      {children}
    </AppShell>
  );
}
