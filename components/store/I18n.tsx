"use client";
import { createContext, useContext } from "react";
import type { Dict, Locale } from "@/lib/i18n";

const Ctx = createContext<{ t: Dict; locale: Locale } | null>(null);

export function I18nProvider({ t, locale, children }: { t: Dict; locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={{ t, locale }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("I18nProvider missing");
  return v;
}

export type Me = { uid: string; role: "client" | "staff" | "admin"; name: string };
const MeCtx = createContext<Me | null>(null);
export function MeProvider({ me, children }: { me: Me; children: React.ReactNode }) {
  return <MeCtx.Provider value={me}>{children}</MeCtx.Provider>;
}
export function useMe() {
  const v = useContext(MeCtx);
  if (!v) throw new Error("MeProvider missing");
  return v;
}
