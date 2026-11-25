"use client";
import { officeWhatsApp } from "@/lib/contact";
import { useI18n } from "@/components/store/I18n";
import { Icon } from "@/components/Icons";
import { daysUntil, deadlinesForClient } from "@/lib/tax";
import { fmtDate } from "@/lib/format";

/** بانر أقرب موعد ضريبي للعميل مع عد تنازلي */
export default function TaxBanner({ clientType }: { clientType: string }) {
  const { t, locale } = useI18n();
  const next = deadlinesForClient(clientType)[0];
  if (!next) return null;
  const days = daysUntil(next.due);
  const urgent = days <= 7;
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm ${urgent ? "bg-gradient-to-l from-red-700 to-navy-900" : "bg-gradient-to-l from-navy-700 to-navy-900"}`}>
      <div className="pointer-events-none absolute -top-10 end-10 h-32 w-32 rounded-full bg-gold-500/20 blur-2xl" />
      <div className="relative flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-center ring-1 ring-white/20">
          <div>
            <div className="ltr-num text-2xl font-bold leading-none text-gold-300">{days}</div>
            <div className="mt-1 text-[10px] text-white/70">{t.portal.days}</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gold-300">⏰ {t.portal.bannerTitle}</div>
          <div className="mt-1 text-lg font-bold">{t.portal.deadlines[next.key]}</div>
          <div className="text-sm text-white/75">
            {t.portal.period} {next.period} · {days === 0 ? t.portal.dueToday : `${fmtDate(next.due, locale)}`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={officeWhatsApp(t.contact.whatsapp, `${t.portal.deadlines[next.key]} — ${next.period}`)} target="_blank" rel="noopener noreferrer" className="btn-gold px-4 py-2">
            <Icon name="chat" className="h-4 w-4" /> {t.arch.contactOffice}
          </a>
        </div>
      </div>
    </div>
  );
}
