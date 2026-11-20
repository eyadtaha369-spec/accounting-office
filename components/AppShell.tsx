"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import LangToggle from "./LangToggle";
import { Icon, icons } from "./Icons";
import { signOut } from "@/app/actions";
import type { Dict } from "@/lib/i18n";

export type NavItem = { href: string; label: string; icon: keyof typeof icons; exact?: boolean };

export default function AppShell({
  t,
  locale,
  items,
  userName,
  roleLabel,
  children,
}: {
  t: Dict;
  locale: "ar" | "en";
  items: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const useDrawer = items.length > 4;
  useEffect(() => setDrawer(false), [path]);
  const isActive = (it: NavItem) => (it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/"));

  return (
    <div className="min-h-screen bg-page lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-950 text-white lg:flex">
        <div className="flex min-h-16 items-center border-b border-white/10 px-4 py-3">
          <Logo name={t.brandShort} light />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(it) ? "bg-gold-500 text-navy-950" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={it.icon} className="h-5 w-5" />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="text-sm font-semibold">{userName}</div>
          <div className="text-xs text-gold-300">{roleLabel}</div>
          <div className="mt-3 flex items-center justify-between">
            <LangToggle locale={locale} label={t.nav.switchLang} dark />
            <form action={signOut}>
              <button className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
                <Icon name="logout" className="h-4 w-4" />
                {t.nav.logout}
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-navy-950 px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          {useDrawer && (
            <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Menu">
              <Icon name="menu" className="h-6 w-6" />
            </button>
          )}
          <Logo name={t.brandShort} light />
        </div>
        <div className="flex items-center">
          <LangToggle locale={locale} label={locale === "ar" ? "EN" : "ع"} dark />
          <form action={signOut}>
            <button className="rounded-lg p-2 text-white/80 hover:bg-white/10" aria-label={t.nav.logout}>
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <main className={`min-w-0 flex-1 lg:pb-0 ${useDrawer ? "pb-6" : "pb-24"}`}>
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Drawer (mobile, many sections) */}
      {useDrawer && drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col bg-navy-950 text-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="text-sm font-semibold">{userName}</span>
              <button onClick={() => setDrawer(false)} className="rounded-lg p-2 hover:bg-white/10"><Icon name="close" /></button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((it) => (
                <Link key={it.href} href={it.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive(it) ? "bg-gold-500 text-navy-950" : "text-white/80 hover:bg-white/10"}`}>
                  <Icon name={it.icon} className="h-5 w-5" />
                  {it.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom tabs (mobile) */}
      {!useDrawer && <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white lg:hidden" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive(it) ? "text-navy-900" : "text-slate-400"}`}
          >
            <Icon name={it.icon} className={`h-5 w-5 ${isActive(it) ? "text-gold-600" : ""}`} />
            <span className="max-w-full truncate px-1">{it.label}</span>
          </Link>
        ))}
      </nav>}
    </div>
  );
}
