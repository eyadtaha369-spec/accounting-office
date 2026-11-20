"use client";
import { useEffect } from "react";

/** صفحة خطأ واضحة بدلاً من رسالة Next.js العامة */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  const ar = typeof document === "undefined" || document.documentElement.lang !== "en";
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-2xl">⚠️</div>
      <h1 className="mt-5 text-xl font-bold text-navy-900">{ar ? "تعذّر تحميل البيانات" : "Couldn't load data"}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {ar
          ? "إذا كنت قد حدّثت الموقع مؤخراً، تأكد من نسخ أحدث ملف Code.gs إلى Apps Script ثم Deploy ← Manage deployments ← New version. وإلا حاول مرة أخرى بعد لحظات."
          : "If the site was just updated, make sure the latest Code.gs is pasted into Apps Script and deployed as a New version. Otherwise, try again in a moment."}
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">ref: {error.digest}</p>}
      <button onClick={reset} className="btn-navy mt-6">{ar ? "إعادة المحاولة" : "Try again"}</button>
    </div>
  );
}
