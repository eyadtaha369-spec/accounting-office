"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Snapshot, SnapshotResult } from "@/lib/store-types";

type Toast = { id: number; text: string; kind: "error" | "ok" };

export type Mutation<T, Res> = {
  /** يُطبَّق على البيانات فوراً قبل رد Google Sheets */
  apply: (d: T) => T;
  /** العملية الفعلية في الخلفية (Server Action) */
  run: () => Promise<Res>;
  /** دمج رد الخادم (مثل رقم الطلب أو التاريخ) بعد النجاح */
  commit?: (d: T, res: Res) => T;
  /** رسالة الخطأ عند الفشل — يتم التراجع عن التعديل تلقائياً */
  error?: string;
  success?: string;
};

export type StoreCtx<T> = {
  data: T | null;
  version: string;
  url: string;
  loading: boolean;
  syncing: boolean;
  lastSync: number;
  failed: boolean;
  refresh: () => Promise<void>;
  mutate: <Res>(m: Mutation<T, Res>) => Promise<Res | null>;
  ticket: (driveId: string) => string;
  addTickets: (t: Record<string, string>) => void;
  toast: (text: string, kind?: "error" | "ok") => void;
};

const TICKET_MAX_AGE = 6 * 60 * 60 * 1000;

/** مخزن بيانات في المتصفح: لقطة واحدة + Cache في sessionStorage + مزامنة خلفية + تحديثات فورية */
export function createStore<T>() {
  const Ctx = createContext<StoreCtx<T> | null>(null);

  function Provider({
    cacheKey,
    loader,
    intervalMs = 60_000,
    children,
  }: {
    cacheKey: string;
    loader: (known?: string) => Promise<SnapshotResult<T>>;
    intervalMs?: number;
    children: React.ReactNode;
  }) {
    const [snap, setSnapState] = useState<Snapshot<T> | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [failed, setFailed] = useState(false);
    const [lastSync, setLastSync] = useState(0);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const snapRef = useRef<Snapshot<T> | null>(null);
    const pending = useRef(0);
    const inFlight = useRef<Promise<void> | null>(null);

    const setSnap = useCallback(
      (next: Snapshot<T> | null) => {
        snapRef.current = next;
        setSnapState(next);
        try {
          if (next) sessionStorage.setItem(cacheKey, JSON.stringify(next));
        } catch {
          /* التخزين ممتلئ أو غير متاح — نكمل من الذاكرة */
        }
      },
      [cacheKey]
    );

    const toast = useCallback((text: string, kind: "error" | "ok" = "error") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, text, kind }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 2500);
    }, []);

    const sync = useCallback(
      (force = false): Promise<void> => {
        if (inFlight.current) return inFlight.current;
        const cur = snapRef.current;
        const stale = !cur || Date.now() - cur.ticketsAt > TICKET_MAX_AGE;
        const p = (async () => {
          setSyncing(true);
          try {
            const res = await loader(force || stale ? undefined : cur?.version);
            setFailed(false);
            setLastSync(Date.now());
            // لا نستبدل البيانات أثناء وجود تعديلات لم تُحفظ بعد (حتى لا تختفي من الشاشة)
            if (!res.unchanged && pending.current === 0) {
              const { unchanged, ...rest } = res;
              void unchanged;
              setSnap(rest as Snapshot<T>);
            }
          } catch (e) {
            console.error("sync failed", e);
            setFailed(true);
          } finally {
            setSyncing(false);
            inFlight.current = null;
          }
        })();
        inFlight.current = p;
        return p;
      },
      [loader, setSnap]
    );

    // تحميل فوري من الكاش ثم تحقق صامت من التحديثات
    useEffect(() => {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as Snapshot<T>;
          snapRef.current = cached;
          setSnapState(cached);
        }
      } catch {
        /* كاش تالف — نتجاهله */
      }
      void sync();
    }, [cacheKey, sync]);

    // مزامنة خلفية كل دقيقة + عند الرجوع للصفحة
    useEffect(() => {
      const tick = () => {
        if (document.visibilityState === "visible") void sync();
      };
      const id = setInterval(tick, intervalMs);
      window.addEventListener("focus", tick);
      return () => {
        clearInterval(id);
        window.removeEventListener("focus", tick);
      };
    }, [sync, intervalMs]);

    const mutate = useCallback(
      async <Res,>(m: Mutation<T, Res>): Promise<Res | null> => {
        const before = snapRef.current;
        if (!before) return null;
        pending.current++;
        setSnap({ ...before, data: m.apply(before.data) });
        try {
          const res = await m.run();
          if (res && typeof res === "object" && "ok" in res && (res as { ok: unknown }).ok === false) throw new Error("rejected");
          if (res && typeof res === "object" && "error" in res && (res as { error?: unknown }).error) throw new Error(String((res as { error: unknown }).error));
          const cur = snapRef.current;
          if (m.commit && cur) setSnap({ ...cur, data: m.commit(cur.data, res) });
          if (m.success) toast(m.success, "ok");
          return res;
        } catch {
          // فشل الحفظ في الشيت: تراجع عن التعديل وأظهر تنبيهاً
          const cur = snapRef.current;
          if (cur) setSnap({ ...cur, data: before.data });
          toast(m.error ?? "Save failed", "error");
          return null;
        } finally {
          pending.current--;
        }
      },
      [setSnap, toast]
    );

    const value = useMemo<StoreCtx<T>>(
      () => ({
        data: snap?.data ?? null,
        version: snap?.version ?? "",
        url: snap?.url ?? "",
        loading: !snap,
        syncing,
        lastSync,
        failed,
        refresh: () => sync(true),
        mutate,
        ticket: (id: string) => snap?.tickets[id] ?? "",
        addTickets: (t: Record<string, string>) => {
          const cur = snapRef.current;
          if (cur) setSnap({ ...cur, tickets: { ...cur.tickets, ...t } });
        },
        toast,
      }),
      [snap, syncing, lastSync, failed, sync, mutate, toast, setSnap]
    );

    return (
      <Ctx.Provider value={value}>
        {children}
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
                t.kind === "error" ? "bg-red-600 text-white ring-red-700" : "bg-navy-900 text-white ring-navy-800"
              }`}
            >
              {t.kind === "error" ? "⚠ " : "✓ "}
              {t.text}
            </div>
          ))}
        </div>
      </Ctx.Provider>
    );
  }

  function useStore() {
    const v = useContext(Ctx);
    if (!v) throw new Error("Store provider missing");
    return v;
  }

  return { Provider, useStore };
}
