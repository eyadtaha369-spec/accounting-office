"use client";
import { useState, useTransition } from "react";
import { revealCredentials, saveCredentials } from "../../actions";
import { Icon } from "@/components/Icons";
import type { Dict } from "@/lib/i18n";

export default function PortalCard({ t, clientId, portal, title, url, saved, canManage }: {
  t: Dict;
  clientId: string;
  portal: "tax_portal" | "e_invoice";
  title: string;
  url: string;
  saved: boolean;
  canManage: boolean;
}) {
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reveal() {
    if (creds) return setCreds(null);
    start(async () => setCreds(await revealCredentials(clientId, portal)));
  }

  async function copy(v: string, key: string) {
    await navigator.clipboard.writeText(v);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveCredentials(clientId, portal, String(fd.get("username") ?? ""), String(fd.get("password") ?? ""));
      if (res.ok) {
        setEditing(false);
        setCreds(null);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-navy-900">{title}</h3>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-gold px-3 py-1.5 text-xs">
          {t.admin.openPortal}
          <Icon name="external" className="h-3.5 w-3.5" />
        </a>
      </div>

      {canManage && (
        <div className="mt-4">
          {editing ? (
            <form onSubmit={onSave} className="space-y-2">
              <input name="username" placeholder={t.admin.username} defaultValue={creds?.username ?? ""} className="input" dir="ltr" autoComplete="off" />
              <input name="password" type="text" placeholder={t.auth.password} defaultValue={creds?.password ?? ""} className="input" dir="ltr" autoComplete="off" />
              <div className="flex gap-2">
                <button disabled={pending} className="btn-navy px-3 py-1.5 text-xs">{t.admin.saveCreds}</button>
                <button type="button" onClick={() => setEditing(false)} className="btn-outline px-3 py-1.5 text-xs">{t.common.cancel}</button>
              </div>
            </form>
          ) : (
            <>
              {creds ? (
                <div className="space-y-2">
                  {[
                    { k: "u", label: t.admin.username, v: creds.username, hidden: false },
                    { k: "p", label: t.auth.password, v: creds.password, hidden: !showPass },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="w-20 shrink-0 text-xs text-slate-500">{row.label}</span>
                      <code className="flex-1 truncate text-sm" dir="ltr">{row.v ? (row.hidden ? "••••••••" : row.v) : "—"}</code>
                      {row.k === "p" && row.v && (
                        <button onClick={() => setShowPass(!showPass)} className="text-xs text-slate-500 hover:text-navy-700">
                          {showPass ? t.admin.hide : t.admin.reveal}
                        </button>
                      )}
                      {row.v && (
                        <button onClick={() => copy(row.v, row.k)} className="text-xs font-semibold text-navy-700 hover:text-gold-600">
                          {copied === row.k ? t.admin.copied : t.admin.copy}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">{saved ? "•••••••• (AES-256)" : t.admin.notSaved}</p>
              )}
              <div className="mt-3 flex gap-2">
                {saved && (
                  <button onClick={reveal} disabled={pending} className="btn-outline px-3 py-1.5 text-xs">
                    {creds ? t.admin.hide : t.admin.reveal}
                  </button>
                )}
                <button onClick={() => setEditing(true)} className="btn-outline px-3 py-1.5 text-xs">{t.admin.editCreds}</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
