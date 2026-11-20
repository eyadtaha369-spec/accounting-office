"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_TYPES, FILE_STATUSES, type Dict } from "@/lib/i18n";
import { updateClientByStaff } from "../../ops-actions";
import type { Profile } from "@/lib/db";

export default function EditClient({ t, client }: { t: Dict; client: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setMsg(null);
    const r = await updateClientByStaff(client.id, Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])));
    setBusy(false);
    if (r.ok) {
      setMsg({ ok: true, text: t.ops.saved });
      setOpen(false);
      router.refresh();
    } else setMsg({ ok: false, text: (t.auth.errors as Record<string, string>)[r.error ?? ""] ?? t.auth.errors.generic });
  }

  if (!open)
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="btn-outline">✏ {t.ops.editClient}</button>
        {msg?.ok && <span className="text-sm text-emerald-700">{msg.text}</span>}
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl bg-page p-4 ring-1 ring-slate-200 sm:grid-cols-2">
      <F name="full_name" label={t.auth.fullName} def={client.full_name} wide />
      <F name="phone" label={t.auth.phone} def={client.phone} ltr />
      <F name="phone_alt" label={t.auth.phoneAlt} def={client.phone_alt} ltr />
      <F name="tax_registration_number" label={t.auth.taxNumber} def={client.tax_registration_number} ltr />
      <div>
        <label className="label">{t.auth.clientType}</label>
        <select name="client_type" defaultValue={client.client_type} className="input">
          {CLIENT_TYPES.map((c) => <option key={c} value={c}>{t.clientTypes[c]}</option>)}
        </select>
      </div>
      <F name="company_name" label={t.auth.companyName} def={client.company_name} />
      <F name="tax_office" label={t.auth.taxOffice} def={client.tax_office} />
      <F name="address" label={t.auth.address} def={client.address} wide />
      <div className="sm:col-span-2">
        <label className="label">{t.ops.fileStatus}</label>
        <select name="file_status" defaultValue={client.file_status || "active"} className="input">
          {FILE_STATUSES.map((s) => <option key={s} value={s}>{t.fileStatus[s]}</option>)}
        </select>
      </div>
      {msg && !msg.ok && <p className="text-sm text-red-600 sm:col-span-2">{msg.text}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy} className="btn-navy">{busy ? t.common.loading : t.ops.save}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline">{t.ops.cancel}</button>
      </div>
    </form>
  );
}

function F({ name, label, def, ltr, wide }: { name: string; label: string; def: string; ltr?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      <input name={name} defaultValue={def} className="input" dir={ltr ? "ltr" : undefined} />
    </div>
  );
}
