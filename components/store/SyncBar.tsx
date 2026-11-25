"use client";
import { useEffect, useState } from "react";
import { Icon } from "../Icons";
import { useI18n } from "./I18n";
import type { StoreCtx } from "./createStore";

/** زر "تحديث البيانات" + حالة المزامنة */
export default function SyncBar<T>({ s }: { s: StoreCtx<T> }) {
  const { t } = useI18n();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);
  const secs = s.lastSync ? Math.max(0, Math.round((Date.now() - s.lastSync) / 1000)) : null;
  const ago =
    secs == null ? "" : secs < 60 ? `${t.sync.ago} ${secs}${t.sync.sec}` : `${t.sync.ago} ${Math.round(secs / 60)}${t.sync.min}`;

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      {s.failed ? (
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-200">⚠ {t.sync.offline}</span>
      ) : (
        <span className="text-slate-400">{s.syncing ? t.sync.syncing : secs != null ? `${t.sync.updated} · ${ago}` : ""}</span>
      )}
      <button
        onClick={() => void s.refresh()}
        disabled={s.syncing}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-navy-800 ring-1 ring-slate-200 transition hover:ring-navy-600 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${s.syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t.sync.refresh}
      </button>
    </div>
  );
}

export function LoadingData() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-500">{t.sync.loadingData}</p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/70 ring-1 ring-slate-200" />
      ))}
    </div>
  );
}

export function Guard<T>({ s, children }: { s: StoreCtx<T>; children: (data: T) => React.ReactNode }) {
  if (!s.data) return <LoadingData />;
  return <>{children(s.data)}</>;
}

void Icon;
