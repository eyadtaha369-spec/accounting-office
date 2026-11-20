"use client";
import { useState } from "react";
import { Icon } from "./Icons";
import { downloadDirect } from "@/lib/direct";

export type SignedFile = { id: string; file_name: string; ticket: string };

export default function FileList({ files, url, downloadLabel, empty = "—" }: { files: SignedFile[]; url: string; downloadLabel: string; empty?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!files.length) return <p className="text-sm text-slate-400">{empty}</p>;

  async function open(f: SignedFile) {
    setBusy(f.id);
    const win = window.open("", "_blank"); // يُفتح فوراً لتجنب حظر النوافذ المنبثقة
    try {
      const blob = await downloadDirect(url, f.ticket);
      const href = URL.createObjectURL(blob);
      if (win) win.location.href = href;
      else {
        const a = document.createElement("a");
        a.href = href;
        a.download = f.file_name;
        a.click();
      }
    } catch {
      win?.close();
      alert("Download failed");
    }
    setBusy(null);
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
      {files.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-3 p-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
            <Icon name="file" className="h-5 w-5 text-slate-400" />
            <span className="truncate">{f.file_name}</span>
          </span>
          <button onClick={() => open(f)} disabled={busy === f.id} className="btn-outline shrink-0 px-3 py-1.5 text-xs">
            {busy === f.id ? "…" : downloadLabel}
          </button>
        </li>
      ))}
    </ul>
  );
}
