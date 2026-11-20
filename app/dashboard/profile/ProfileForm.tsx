"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "../actions";
import { CLIENT_TYPES, type Dict } from "@/lib/i18n";
import { normalizeDigits, re } from "@/lib/validation";
import type { Profile } from "@/lib/db";
import { Icon } from "@/components/Icons";

export default function ProfileForm({ t, profile }: { t: Dict; profile: Profile }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => normalizeDigits(String(fd.get(k) ?? "").trim());
    const phone = v("phone");
    const phone_alt = v("phone_alt");
    const tax = v("tax_registration_number");
    if (!re.phone.test(phone) || (phone_alt && !re.phone.test(phone_alt))) return setMsg({ ok: false, text: t.auth.errors.phone });
    if (tax && !re.tax.test(tax)) return setMsg({ ok: false, text: t.auth.errors.taxNumber });
    setLoading(true);
    let error = false;
    try {
      const res = await updateProfile({
        phone,
        phone_alt,
        tax_registration_number: tax,
        client_type: String(fd.get("client_type")),
        company_name: String(fd.get("company_name") ?? ""),
        tax_office: String(fd.get("tax_office") ?? ""),
        address: String(fd.get("address") ?? ""),
      });
      error = "error" in res;
    } catch {
      error = true;
    }
    setLoading(false);
    setMsg(error ? { ok: false, text: t.auth.errors.generic } : { ok: true, text: t.dash.saved });
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-6 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Locked label={t.auth.fullName} value={profile.full_name} />
        <Locked label={t.auth.email} value={profile.email} ltr />
        <Locked label={t.auth.nationalId} value={profile.national_id} ltr />
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Icon name="lock" className="h-4 w-4" /> {t.dash.lockedNote}
      </p>
      <hr className="border-slate-200" />
      <p className="text-sm font-semibold text-gold-600">{t.dash.editable}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.auth.phone} name="phone" def={profile.phone} ltr />
        <Field label={t.auth.phoneAlt} name="phone_alt" def={profile.phone_alt} ltr />
        <Field label={t.auth.taxNumber} name="tax_registration_number" def={profile.tax_registration_number} ltr />
        <div>
          <label className="label">{t.auth.clientType}</label>
          <select name="client_type" defaultValue={profile.client_type} className="input">
            {CLIENT_TYPES.map((c) => (
              <option key={c} value={c}>{t.clientTypes[c]}</option>
            ))}
          </select>
        </div>
        <Field label={t.auth.companyName} name="company_name" def={profile.company_name} />
        <Field label={t.auth.taxOffice} name="tax_office" def={profile.tax_office} />
        <div className="sm:col-span-2">
          <Field label={t.auth.address} name="address" def={profile.address} />
        </div>
      </div>
      {msg && <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button disabled={loading} className="btn-navy">{loading ? t.common.loading : t.dash.save}</button>
    </form>
  );
}

function Locked({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input disabled value={value} className="input" dir={ltr ? "ltr" : undefined} />
    </div>
  );
}

function Field({ label, name, def, ltr }: { label: string; name: string; def: string | null; ltr?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} defaultValue={def ?? ""} className="input" dir={ltr ? "ltr" : undefined} />
    </div>
  );
}
