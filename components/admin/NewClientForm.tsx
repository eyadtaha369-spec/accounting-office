"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CLIENT_TYPES, type Dict } from "@/lib/i18n";
import { ID_IMAGE_TYPES, MAX_ID_BYTES, normalizeDigits, re } from "@/lib/validation";
import { strongPassword } from "@/lib/credentials-text";
import { uploadDirect } from "@/lib/direct";
import { adminCreateClient, getAdminIdTicket } from "@/app/admin/actions";
import type { ClientFields } from "@/lib/client-input";
import CredentialsCard from "@/components/CredentialsCard";
import ServiceChecks from "./ServiceChecks";
import { serializeServices } from "@/lib/services";
import { useAdmin } from "@/components/store/stores";
import { nowIso, replaceById, tmpId } from "@/lib/view";

type Errors = Partial<Record<string, string>>;
const FIELDS = ["full_name", "phone", "phone_alt", "email", "password", "national_id", "tax_registration_number", "client_type", "company_name", "tax_office", "address"] as const;

export default function NewClientForm({ t }: { t: Dict }) {
  const s = useAdmin();
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ id: string; saving: boolean; name: string; phone: string; email: string; password: string } | null>(null);

  function validate(fd: FormData): Errors {
    const e: Errors = {};
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("full_name")) e.full_name = t.auth.errors.required;
    if (!re.phone.test(normalizeDigits(v("phone")))) e.phone = t.auth.errors.phone;
    if (v("phone_alt") && !re.phone.test(normalizeDigits(v("phone_alt")))) e.phone_alt = t.auth.errors.phone;
    if (!re.email.test(v("email"))) e.email = t.auth.errors.email;
    if (password.length < 8) e.password = t.auth.errors.password;
    if (!re.nationalId.test(normalizeDigits(v("national_id")))) e.national_id = t.auth.errors.nationalId;
    if (v("tax_registration_number") && !re.tax.test(normalizeDigits(v("tax_registration_number")))) e.tax_registration_number = t.auth.errors.taxNumber;
    for (const k of ["id_front", "id_back"]) {
      const f = fd.get(k);
      if (f instanceof File && f.size > 0 && (!ID_IMAGE_TYPES.includes(f.type) || f.size > MAX_ID_BYTES)) e[k] = t.auth.errors.fileType;
    }
    return e;
  }

  const [services, setServices] = useState<string[]>([]);
  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setFormError("");
    const fd = new FormData(ev.currentTarget);
    fd.set("password", password);
    const e = validate(fd);
    setErrors(e);
    if (Object.keys(e).length) return;
    // فحص فوري للتكرار من البيانات المحفوظة في الذاكرة
    const input = { ...(Object.fromEntries(FIELDS.map((k) => [k, String(fd.get(k) ?? "")])) as unknown as ClientFields), services };
    const email = input.email.trim().toLowerCase();
    const nid = normalizeDigits(input.national_id.trim());
    const users = s.data?.Users ?? [];
    if (users.some((u) => u.email === email)) return setErrors({ email: t.auth.errors.duplicateEmail });
    if (users.some((u) => u.national_id === nid)) return setErrors({ national_id: t.auth.errors.duplicateId });

    setLoading(true);
    let ids = null;
    try {
      // صور البطاقة تحتاج رفعاً فعلياً أولاً
      const front = fd.get("id_front") as File | null;
      const back = fd.get("id_back") as File | null;
      if ((front && front.size) || (back && back.size)) {
        const tk = await getAdminIdTicket();
        ids = {
          ticket: tk.ticket,
          front: front && front.size ? await uploadDirect(tk, front) : undefined,
          back: back && back.size ? await uploadDirect(tk, back) : undefined,
        };
      }
    } catch {
      setLoading(false);
      return setFormError(t.auth.errors.generic);
    }
    setLoading(false);

    // إظهار العميل فوراً + بيانات الدخول، والحفظ في الخلفية
    const tid = tmpId();
    const optimistic = {
      id: tid, role: "client", file_status: "active", full_name: input.full_name.trim(), email, phone: normalizeDigits(input.phone),
      phone_alt: normalizeDigits(input.phone_alt), national_id: nid, tax_registration_number: normalizeDigits(input.tax_registration_number),
      client_type: input.client_type, company_name: input.company_name, tax_office: input.tax_office, address: input.address,
      id_front_file: "", id_back_file: "", created_at: nowIso(), services: serializeServices(services),
    };
    setCreated({ id: tid, saving: true, name: optimistic.full_name, phone: optimistic.phone, email, password });
    window.scrollTo({ top: 0, behavior: "smooth" });
    const res = await s.mutate({
      apply: (d) => ({ ...d, Users: [optimistic, ...d.Users] }),
      run: () => adminCreateClient(input, ids),
      commit: (d, r) => {
        if (!("ok" in r)) return d;
        s.addTickets(r.tickets);
        return { ...d, Users: replaceById(d.Users, tid, r.user), Notes: [r.note, ...d.Notes] };
      },
      error: t.sync.saveFailed,
    });
    if (res && "ok" in res) {
      setCreated((c) => (c ? { ...c, id: res.id, saving: false } : c));
    } else {
      // فشل الحفظ: رجوع للنموذج مع توضيح السبب
      setCreated(null);
      const r = res as { error?: string; field?: string } | null;
      const m = (r?.error && (t.auth.errors as Record<string, string>)[r.error]) || t.sync.saveFailed;
      if (r?.field) setErrors({ [r.field]: m });
      setFormError(m);
    }
  }

  if (created) {
    return (
      <div className="space-y-5">
        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-emerald-700">✓ {t.admin.clientCreated}</h2>
          <p className="mt-1 text-sm text-slate-600">{created.name}</p>
        </div>
        <CredentialsCard t={t} name={created.name} phone={created.phone} email={created.email} password={created.password} />
        <div className="flex flex-wrap gap-2">
          {created.saving ? (
            <span className="btn-gold opacity-60">{t.sync.syncing}</span>
          ) : (
            <Link href={`/admin/clients/${created.id}`} className="btn-gold">{t.admin.openClientFile}</Link>
          )}
          <button
            onClick={() => {
              setCreated(null);
              setPassword("");
              formRef.current?.reset();
            }}
            className="btn-outline"
          >
            {t.admin.addAnother}
          </button>
        </div>
      </div>
    );
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="field-error">{errors[k]}</p> : null);
  const Req = () => <span className="text-red-500"> *</span>;
  const Opt = () => <span className="text-xs font-normal text-slate-400"> ({t.auth.optional})</span>;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="card space-y-8 p-5 sm:p-7">
      <fieldset>
        <legend className="mb-4 text-sm font-bold text-gold-600">{t.auth.sectionPersonal}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">{t.auth.fullName}<Req /></label>
            <input name="full_name" className="input" />
            <Err k="full_name" />
          </div>
          <div>
            <label className="label">{t.auth.phone}<Req /></label>
            <input name="phone" type="tel" inputMode="numeric" className="input" dir="ltr" placeholder="01XXXXXXXXX" />
            <Err k="phone" />
          </div>
          <div>
            <label className="label">{t.auth.phoneAlt}<Opt /></label>
            <input name="phone_alt" type="tel" inputMode="numeric" className="input" dir="ltr" placeholder="01XXXXXXXXX" />
            <Err k="phone_alt" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t.auth.nationalId}<Req /></label>
            <input name="national_id" inputMode="numeric" maxLength={14} className="input tracking-widest" dir="ltr" />
            <Err k="national_id" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl bg-navy-900/[0.03] p-4 ring-1 ring-navy-900/10">
        <legend className="px-1 text-sm font-bold text-gold-600">{t.admin.loginSection}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.auth.email}<Req /></label>
            <input name="email" type="email" className="input" dir="ltr" autoComplete="off" />
            <Err k="email" />
          </div>
          <div>
            <label className="label">{t.auth.password}<Req /></label>
            <div className="flex gap-2">
              <input
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input font-mono"
                dir="ltr"
                autoComplete="new-password"
                placeholder={t.auth.passwordHint}
              />
            </div>
            <button type="button" onClick={() => setPassword(strongPassword())} className="mt-2 text-xs font-semibold text-navy-700 hover:text-gold-600">
              🔑 {t.admin.generate}
            </button>
            <Err k="password" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-sm font-bold text-gold-600">{t.auth.sectionBusiness}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.auth.clientType}<Req /></label>
            <select name="client_type" className="input" defaultValue="individual">
              {CLIENT_TYPES.map((c) => (
                <option key={c} value={c}>{t.clientTypes[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t.auth.taxNumber}<Opt /></label>
            <input name="tax_registration_number" inputMode="numeric" maxLength={9} className="input tracking-widest" dir="ltr" />
            <Err k="tax_registration_number" />
          </div>
          <div>
            <label className="label">{t.auth.companyName}<Opt /></label>
            <input name="company_name" className="input" />
          </div>
          <div>
            <label className="label">{t.auth.taxOffice}<Opt /></label>
            <input name="tax_office" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t.auth.address}<Opt /></label>
            <input name="address" className="input" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-bold text-gold-600">{t.arch.servicesTitle}</legend>
        <p className="mb-3 text-xs text-slate-500">{t.arch.servicesHint}</p>
        <ServiceChecks t={t} value={services} onChange={setServices} />
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-sm font-bold text-gold-600">{t.admin.idImagesOptional}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["front", "back"] as const).map((side) => (
            <div key={side}>
              <label className="label">{side === "front" ? t.auth.idFront : t.auth.idBack}</label>
              <input
                type="file"
                name={`id_${side}`}
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-900 hover:file:bg-slate-200"
              />
              <Err k={`id_${side}`} />
            </div>
          ))}
        </div>
      </fieldset>

      {formError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
      <button type="submit" disabled={loading} className="btn-navy w-full py-3 text-base">
        {loading ? t.auth.submitting : t.admin.createClient}
      </button>
    </form>
  );
}
