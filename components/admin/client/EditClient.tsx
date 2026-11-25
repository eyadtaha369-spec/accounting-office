"use client";
import { useState } from "react";
import { CLIENT_TYPES, FILE_STATUSES, type Dict } from "@/lib/i18n";
import { updateClientByStaff } from "@/app/admin/ops-actions";
import { useAdmin } from "@/components/store/stores";
import { patchById, replaceById } from "@/lib/view";
import { normalizeDigits, re } from "@/lib/validation";
import type { R } from "@/lib/store-types";

export default function EditClient({ t, client }: { t: Dict; client: R }) {
  const s = useAdmin();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = Object.fromEntries([...new FormData(e.currentTarget).entries()].map(([k, v]) => [k, String(v).trim()]));
    for (const k of ["phone", "phone_alt", "tax_registration_number"]) input[k] = normalizeDigits(input[k] ?? "");
    // تحقق فوري قبل التحديث
    if (!input.full_name) return setMsg({ ok: false, text: t.auth.errors.required });
    if (!re.phone.test(input.phone) || (input.phone_alt && !re.phone.test(input.phone_alt))) return setMsg({ ok: false, text: t.auth.errors.phone });
    if (input.tax_registration_number && !re.tax.test(input.tax_registration_number)) return setMsg({ ok: false, text: t.auth.errors.taxNumber });
    setMsg({ ok: true, text: t.ops.saved });
    setOpen(false);
    void s.mutate({
      apply: (d) => ({ ...d, Users: patchById(d.Users, client.id, input) }),
      run: () => updateClientByStaff(client.id, input),
      commit: (d, r) => (r.ok ? { ...d, Users: replaceById(d.Users, client.id, r.user) } : d),
      error: t.sync.saveFailed,
    });
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
        <button className="btn-navy">{t.ops.save}</button>
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
