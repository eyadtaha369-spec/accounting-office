import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import Logo from "@/components/Logo";
import { Icon } from "@/components/Icons";
import { getDict } from "@/lib/locale";
import { getSession } from "@/lib/auth";

const whyIcons = ["lock", "clock", "badge", "pulse"] as const;
const serviceIcons = ["building", "receipt", "chip", "search", "book", "shield"] as const;

export default async function Home() {
  const { t, locale } = await getDict();
  const session = await getSession();
  const accountHref = session ? (session.role === "client" ? "/dashboard" : "/admin") : null;

  return (
    <>
      <PublicNav t={t} locale={locale} accountHref={accountHref} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute -top-40 end-[-10%] h-[520px] w-[520px] rounded-full bg-gold-500/15 blur-3xl" />
        <div className="container-x relative grid items-center gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
              <Icon name="badge" className="h-4 w-4" />
              {t.hero.badge}
            </span>
            <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl sm:leading-[1.2]">
              {t.hero.title}
              <br />
              <span className="text-gold-400">{t.hero.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">{t.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="btn-gold px-6 py-3 text-base">
                {t.hero.ctaRegister}
              </Link>
              <Link href="/dashboard/new?type=feasibility" className="btn-ghost-light px-6 py-3 text-base">
                {t.hero.ctaConsult}
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {[
                { n: "+15", l: t.hero.stat1 },
                { n: "+1,200", l: t.hero.stat2 },
                { n: "100%", l: t.hero.stat3 },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-6">
                  <div className="ltr-num text-2xl font-bold text-gold-400 sm:text-4xl">{s.n}</div>
                  <div className="mt-1 text-xs text-white/70 sm:text-sm">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="scroll-mt-16 bg-white py-20">
        <div className="container-x">
          <SectionHead title={t.why.title} subtitle={t.why.subtitle} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.why.items.map((it, i) => (
              <div key={it.title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-gold-400">
                  <Icon name={whyIcons[i]} className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy-900">{it.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-16 bg-slate-50 py-20">
        <div className="container-x">
          <SectionHead title={t.services.title} subtitle={t.services.subtitle} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.services.items.map((s, i) => (
              <div key={s.title} className="card group relative overflow-hidden p-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-500 to-gold-300 opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-600">
                    <Icon name={serviceIcons[i]} className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-900">{s.title}</h3>
                </div>
                <ul className="mt-5 space-y-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm leading-6 text-slate-600">
                      <Icon name="check" className="mt-0.5 h-4 w-4 text-gold-600" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="steps" className="scroll-mt-16 bg-white py-20">
        <div className="container-x">
          <SectionHead title={t.steps.title} subtitle={t.steps.subtitle} />
          <ol className="relative mt-14 grid gap-8 md:grid-cols-4">
            <div className="absolute inset-x-[12%] top-7 hidden h-px bg-gradient-to-r from-gold-500/10 via-gold-500/60 to-gold-500/10 md:block" />
            {t.steps.items.map((s, i) => (
              <li key={s.title} className="relative text-center">
                <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-navy-900 text-lg font-bold text-gold-400 shadow-md">
                  {i + 1}
                </div>
                <h3 className="mt-5 font-bold text-navy-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 pb-20">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 to-navy-700 px-6 py-12 text-center text-white sm:px-12">
            <div className="pointer-events-none absolute -bottom-24 start-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold-500/20 blur-3xl" />
            <h2 className="relative text-2xl font-bold sm:text-3xl">{t.cta.title}</h2>
            <p className="relative mx-auto mt-3 max-w-2xl text-white/75">{t.cta.body}</p>
            <Link href="/register" className="btn-gold relative mt-7 px-8 py-3 text-base">
              {t.cta.button}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="scroll-mt-16 bg-navy-950 text-white/75">
        <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo name={t.brandShort} tag={t.brandTag} light />
            <p className="mt-4 text-sm leading-7">{t.footer.about}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white">{t.footer.contact}</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2"><Icon name="pin" className="h-5 w-5 text-gold-400" />{t.footer.address}</li>
              <li className="flex gap-2"><Icon name="phone" className="h-5 w-5 text-gold-400" /><a href={`tel:${t.footer.phone.replace(/\s/g, "")}`} className="ltr-num hover:text-white">{t.footer.phone}</a></li>
              <li className="flex gap-2"><Icon name="mail" className="h-5 w-5 text-gold-400" /><a href={`mailto:${t.footer.email}`} className="hover:text-white">{t.footer.email}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">{t.footer.hours}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>{t.footer.hoursValue}</li>
              <li>{t.footer.hoursValue2}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">{t.footer.links}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#services" className="hover:text-gold-300">{t.nav.services}</a></li>
              <li><a href="#steps" className="hover:text-gold-300">{t.nav.steps}</a></li>
              <li><Link href="/register" className="hover:text-gold-300">{t.nav.register}</Link></li>
              <li><Link href="/login" className="hover:text-gold-300">{t.nav.login}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {t.brand} — {t.footer.rights}
        </div>
      </footer>
    </>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gold-500" />
      <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h2>
      <p className="mt-3 text-slate-600">{subtitle}</p>
    </div>
  );
}
