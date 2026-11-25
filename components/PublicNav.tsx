"use client";
import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";
import LangToggle from "./LangToggle";
import type { Dict } from "@/lib/i18n";

export default function PublicNav({
  t,
  locale,
  accountHref,
}: {
  t: Dict;
  locale: "ar" | "en";
  accountHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/#why", label: t.nav.why },
    { href: "/#services", label: t.nav.services },
    { href: "/#calculators", label: t.nav.calculators },
    { href: "/#steps", label: t.nav.steps },
    { href: "/#contact", label: t.nav.contact },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur">
      <nav className="container-x flex h-16 items-center justify-between gap-4">
        <Logo name={t.brandShort} tag={t.brandTag} light />
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <LangToggle locale={locale} label={t.nav.switchLang} dark />
          {accountHref ? (
            <Link href={accountHref} className="btn-gold">{t.nav.dashboard}</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost-light">{t.nav.login}</Link>
              <Link href="/register" className="btn-gold">{t.nav.register}</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <LangToggle locale={locale} label={locale === "ar" ? "EN" : "ع"} dark />
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Menu">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-white/10 lg:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-white/85 hover:bg-white/10">
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {accountHref ? (
                <Link href={accountHref} className="btn-gold col-span-2">{t.nav.dashboard}</Link>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost-light">{t.nav.login}</Link>
                  <Link href="/register" className="btn-gold">{t.nav.register}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
