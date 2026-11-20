"use client";
import { useEffect, useState } from "react";
import { downloadDirect } from "@/lib/direct";

/** يعرض صورة خاصة من Drive (صورة البطاقة) دون جعلها عامة */
export default function DriveImage({ url, ticket, alt, label }: { url: string; ticket: string; alt: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let href = "";
    downloadDirect(url, ticket)
      .then((b) => {
        href = URL.createObjectURL(b);
        setSrc(href);
      })
      .catch(() => setFailed(true));
    return () => {
      if (href) URL.revokeObjectURL(href);
    };
  }, [url, ticket]);

  if (failed) return <div className="grid h-36 place-items-center rounded-xl bg-red-50 text-xs text-red-600">⚠</div>;
  if (!src) return <div className="h-36 animate-pulse rounded-xl bg-slate-100" />;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-xl border border-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-36 w-full bg-slate-50 object-contain transition group-hover:scale-[1.02]" />
      <span className="block border-t border-slate-100 py-1.5 text-center text-xs font-semibold text-navy-700">{label}</span>
    </a>
  );
}
