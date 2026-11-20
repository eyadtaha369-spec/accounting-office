import Logo from "./Logo";
import LangToggle from "./LangToggle";
import type { Dict } from "@/lib/i18n";

export default function AuthShell({ t, locale, children, wide = false }: { t: Dict; locale: "ar" | "en"; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-navy-950 to-navy-800" />
      <div className="container-x relative flex h-16 items-center justify-between">
        <Logo name={t.brandShort} tag={t.brandTag} light />
        <LangToggle locale={locale} label={t.nav.switchLang} dark />
      </div>
      <main className={`relative mx-auto px-4 pb-16 pt-6 ${wide ? "max-w-3xl" : "max-w-md"}`}>{children}</main>
    </div>
  );
}
