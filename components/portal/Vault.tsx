"use client";
import { useState } from "react";
import { useI18n } from "@/components/store/I18n";
import { useAdmin } from "@/components/store/stores";
import { Icon } from "@/components/Icons";
import { openDriveFile } from "./openFile";
import { parseVault, VAULT_KEYS } from "@/lib/vault";
import { uploadDirect } from "@/lib/direct";
import { checkFiles } from "@/lib/format";
import { clearVaultItem, getPortalTicket, setVaultItem } from "@/app/portal-actions";
import { patchById } from "@/lib/view";
import type { R } from "@/lib/store-types";

type Key = (typeof VAULT_KEYS)[number] | "poa";
const colOf = (k: Key) => (k === "poa" ? "poa_file" : `vault_${k}`);

/** عرض خزنة المستندات — مشترك بين العميل والأدمن */
export function VaultGrid({ row, url, ticket, keys = [...VAULT_KEYS], actions }: {
  row: R; url: string; ticket: (id: string) => string; keys?: Key[]; actions?: (k: Key) => React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {keys.map((k) => {
        const item = parseVault(row[colOf(k)]);
        return (
          <div key={k} className={`rounded-xl p-4 ring-1 ${item ? "bg-white ring-emerald-200" : "bg-page ring-slate-200"}`}>
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${item ? "bg-emerald-50 text-emerald-600" : "bg-white text-slate-300"}`}>
                <Icon name={item ? "check" : "file"} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy-900">{t.portal.vault[k]}</div>
                <div className="truncate text-xs text-slate-500">{item ? (item.type === "drive" ? item.name : item.url) : t.portal.vaultEmpty}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item && (
                <button
                  onClick={() => (item.type === "url" ? window.open(item.url, "_blank", "noopener") : openDriveFile(url, ticket(item.id)))}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  <Icon name="external" className="h-3.5 w-3.5" /> {t.portal.open}
                </button>
              )}
              {actions?.(k)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** نسخة الأدمن: رفع/رابط/إزالة بتحديث فوري */
export function AdminVault({ client, keys }: { client: R; keys?: Key[] }) {
  const s = useAdmin();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Key | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState<Key | null>(null);

  async function upload(k: Key, f?: File) {
    if (!f) return;
    if (!checkFiles([f])) return s.toast(t.dash.fileTypeDocs);
    setBusy(k);
    try {
      const tk = await getPortalTicket("vault", client.id);
      const up = await uploadDirect(tk, f);
      const r = await setVaultItem(client.id, k, {}, tk.ticket, up);
      if (!r.ok) throw new Error();
      s.addTickets({ [r.fileId]: r.ticket });
      void s.mutate({ apply: (d) => ({ ...d, Users: patchById(d.Users, client.id, { [r.col]: r.value }) }), run: async () => ({ ok: true }) });
    } catch {
      s.toast(t.sync.saveFailed);
    }
    setBusy(null);
  }

  function saveLink(k: Key) {
    const v = link.trim();
    if (!/^https?:\/\//i.test(v)) return;
    setEditing(null);
    setLink("");
    void s.mutate({
      apply: (d) => ({ ...d, Users: patchById(d.Users, client.id, { [colOf(k)]: `url:${v}` }) }),
      run: () => setVaultItem(client.id, k, { link: v }),
      error: t.sync.saveFailed,
    });
  }

  const clear = (k: Key) =>
    void s.mutate({
      apply: (d) => ({ ...d, Users: patchById(d.Users, client.id, { [colOf(k)]: "" }) }),
      run: () => clearVaultItem(client.id, k),
      error: t.sync.saveFailed,
    });

  return (
    <VaultGrid
      row={client}
      url={s.url}
      ticket={s.ticket}
      keys={keys}
      actions={(k) => (
        <>
          <label className={`btn-outline cursor-pointer px-3 py-1.5 text-xs ${busy === k ? "opacity-60" : ""}`}>
            <Icon name="upload" className="h-3.5 w-3.5" />
            {busy === k ? "…" : parseVault(client[colOf(k)]) ? t.portal.replace : t.portal.upload}
            <input type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={busy === k} onChange={(e) => upload(k, e.target.files?.[0])} />
          </label>
          {editing === k ? (
            <span className="flex w-full gap-1">
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" className="input py-1.5 text-xs" dir="ltr" />
              <button onClick={() => saveLink(k)} className="btn-navy px-2 py-1 text-xs">{t.portal.saveLink}</button>
            </span>
          ) : (
            <button onClick={() => setEditing(k)} className="px-2 py-1.5 text-xs font-semibold text-navy-700 hover:text-gold-600">🔗 {t.portal.orLink}</button>
          )}
          {parseVault(client[colOf(k)]) && (
            <button onClick={() => clear(k)} className="px-2 py-1.5 text-xs text-red-600 hover:underline">{t.portal.remove}</button>
          )}
        </>
      )}
    />
  );
}
