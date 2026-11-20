"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icons";

export default function DeleteButton({ onDelete, label, confirm }: { onDelete: () => Promise<unknown>; label: string; confirm: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  if (!ask)
    return (
      <button type="button" onClick={() => setAsk(true)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title={label}>
        <Icon name="trash" className="h-4 w-4" />
      </button>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await onDelete(); setAsk(false); router.refresh(); })}
        className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
      >
        {pending ? "…" : confirm}
      </button>
      <button type="button" onClick={() => setAsk(false)} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">✕</button>
    </span>
  );
}
