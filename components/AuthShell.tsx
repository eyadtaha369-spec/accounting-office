import Logo from "./Logo";
import InstallApp from "./pwa/InstallApp";
import LangToggle from "./LangToggle";
import { Icon, icons } from "./Icons";
import type { Dict } from "@/lib/i18n";

/** بوابة دخول مؤسسية: لوحة الهوية والتطمين + نموذج الدخول/التسجيل */
export default function AuthShell({ t, locale, children, wide = false }: { t: Dict; locale: "ar" | "en"; children: React.ReactNode; wide?: boolean }) {
  const trust: { icon: keyof typeof icons; text: string }[] = [
    { icon: "lock", text: t.portal.trust.encrypted },
    { icon: "shield", text: t.portal.trust.private },
    { icon: "badge", text: t.portal.trust.certified },
    { icon: "check", text: t.portal.trust.secure },
  ];
  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[minmax(380px,42%)_1fr]">
      {/* لوحة الهوية */}
      <aside className="relative overflow-hidden bg-navy-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #c7a45b 0 1px, transparent 1px 22px)" }}
        />
        <div className="pointer-events-none absolute -bottom-32 -start-24 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 end-0 h-72 w-72 rounded-full bg-navy-700/60 blur-3xl" />
        <div className="relative flex h-full flex-col px-6 py-6 sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:py-10">
          <div className="flex items-center justify-between">
            <Logo name={t.brandShort} tag={t.brandTag} light />
            <LangToggle locale={locale} label={t.nav.switchLang} dark />
          </div>
          <div className="mt-10 hidden flex-1 flex-col justify-center lg:flex">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
              <Icon name="lock" className="h-3.5 w-3.5" /> {t.portal.authWelcome}
            </div>
            <h1 className="mt-5 text-3xl font-bold leading-snug xl:text-4xl">{t.brand}</h1>
            <p className="mt-4 max-w-md text-base leading-8 text-white/70">{t.portal.authLead}</p>
            <ul className="mt-10 space-y-4">
              {trust.map((x) => (
                <li key={x.text} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-gold-400 ring-1 ring-gold-500/30">
                    <Icon name={x.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-sm text-white/85">{x.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-8 hidden text-xs text-white/40 lg:block">© {new Date().getFullYear()} {t.brand}</p>
        </div>
      </aside>

      {/* النموذج */}
      <main className="flex items-start justify-center px-4 py-8 sm:py-12 lg:items-center">
        <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"}`}>
          {children}
          <div className="mt-6 flex justify-center"><InstallApp t={t} /></div>
          {/* شارات الثقة على الموبايل */}
          <ul className="mt-6 grid grid-cols-2 gap-2 lg:hidden">
            {trust.map((x) => (
              <li key={x.text} className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                <Icon name={x.icon} className="h-4 w-4 text-gold-600" />
                {x.text}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
