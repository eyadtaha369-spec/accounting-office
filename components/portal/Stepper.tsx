"use client";
import { useI18n } from "@/components/store/I18n";
import { Icon } from "@/components/Icons";

/** شريط تتبع بصري من 4 مراحل */
export function stepOf(status: string) {
  return status === "completed" ? 3 : status === "in_progress" ? 2 : status === "needs_documents" || status === "pending_review" ? 1 : 0;
}

export default function Stepper({ status, compact = false }: { status: string; compact?: boolean }) {
  const { t } = useI18n();
  const labels = t.portal.steps;
  if (status === "cancelled") {
    return <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">✕ {t.portal.stepCancelled}</div>;
  }
  const current = stepOf(status);
  const done = status === "completed";
  const warn = status === "needs_documents";
  return (
    <div>
      <ol className="flex items-start">
        {labels.map((label, i) => {
          const complete = i < current || (done && i === current);
          const active = i === current && !done;
          const circle = complete
            ? "bg-emerald-500 text-white ring-emerald-100"
            : active
              ? warn
                ? "bg-orange-500 text-white ring-orange-100 animate-pulse"
                : "bg-gold-500 text-navy-950 ring-gold-300/40"
              : "bg-white text-slate-400 ring-slate-200";
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && (
                <span className={`absolute h-1 w-full ${compact ? "top-2.5" : "top-3.5"} ${i <= current ? "bg-emerald-400" : "bg-slate-200"}`} style={{ insetInlineEnd: "50%" }} />
              )}
              <span className={`relative z-10 grid place-items-center rounded-full font-bold ring-4 ${compact ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"} ${circle}`}>
                {complete ? <Icon name="check" className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} /> : i + 1}
              </span>
              {!compact && <span className={`mt-2 px-1 text-[11px] leading-4 sm:text-xs ${active || complete ? "font-semibold text-navy-900" : "text-slate-400"}`}>{label}</span>}
            </li>
          );
        })}
      </ol>
      {warn && !compact && <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-center text-xs font-semibold text-orange-800">📎 {t.portal.stepNeedsDocs}</p>}
    </div>
  );
}
