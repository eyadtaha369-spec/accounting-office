"use client";
import { createContext, useContext } from "react";
import { useAdmin, useClient } from "./stores";
import { useI18n } from "./I18n";
import { pageIcon, pageTitle, sortPages, type IconName, type Row } from "@/lib/site";

const Ctx = createContext<Row[]>([]);

/** الصفحات من المخزن المحلي (تتحدث فوراً مع أي تعديل)، ومن الخادم قبل اكتمال التحميل */
export function AdminSitePages({ initial, children }: { initial: Row[]; children: React.ReactNode }) {
  const s = useAdmin();
  return <Ctx.Provider value={s.data?.SitePages ?? initial}>{children}</Ctx.Provider>;
}
export function ClientSitePages({ initial, children }: { initial: Row[]; children: React.ReactNode }) {
  const s = useClient();
  return <Ctx.Provider value={s.data?.SitePages ?? initial}>{children}</Ctx.Provider>;
}

export function usePages() {
  const rows = useContext(Ctx);
  const { t, locale } = useI18n();
  const all = sortPages(rows);
  const get = (k: string) => all.find((p) => p.id === k);
  return {
    all,
    active: all.filter((p) => p.is_active !== "no"),
    get,
    label: (k: string): string => (!k || k === "general" ? t.arch.svc.general : pageTitle(get(k), locale) || (t.arch.svc as Record<string, string>)[k] || k),
    icon: (k: string): IconName => (!k || k === "general" ? "archive" : pageIcon(get(k))),
  };
}
