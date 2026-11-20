"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions";

export default function LangToggle({ locale, label, dark = false }: { locale: "ar" | "en"; label: string; dark?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setLocale(locale === "ar" ? "en" : "ar");
          router.refresh();
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        dark ? "text-white/90 hover:bg-white/10" : "text-navy-900 hover:bg-slate-100"
      }`}
      aria-label="Switch language"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
      </svg>
      {label}
    </button>
  );
}
