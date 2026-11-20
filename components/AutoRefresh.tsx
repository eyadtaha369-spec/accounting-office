"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** تحديث تلقائي كل فترة (بديل التحديث اللحظي) — يتوقف عندما تكون الصفحة في الخلفية */
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, seconds]);
  return null;
}
