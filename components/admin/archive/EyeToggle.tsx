"use client";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/components/store/I18n";

/** 👁️ ظاهر للعميل (أخضر) / 🚫 مخفي (رمادي) — ضغطة واحدة */
export default function EyeToggle({ on, onToggle, compact = false, disabled = false }: { on: boolean; onToggle: () => void; compact?: boolean; disabled?: boolean }) {
  const { t } = useI18n();
  const label = on ? t.arch.visible : t.arch.hidden;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={label}
      aria-pressed={on}
      aria-label={label}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition disabled:opacity-50 ${
        on ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"
      }`}
    >
      <Icon name={on ? "eye" : "eyeOff"} className="h-4 w-4" />
      {!compact && <span>{label}</span>}
    </button>
  );
}
