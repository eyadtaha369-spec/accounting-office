"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_TYPES, type Dict } from "@/lib/i18n";
import { ID_IMAGE_TYPES, MAX_ID_BYTES, normalizeDigits, re } from "@/lib/validation";
import { Icon } from "@/components/Icons";
import { getRegisterTicket, register, type RegisterInput } from "@/app/actions";
import { uploadDirect } from "@/lib/direct";

type Errors = Partial<Record<string, string>>;

export default function RegisterForm({ t }: { t: Dict }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<{ front?: string; back?: string }>({});

  function validate(fd: FormData): Errors {
    const e: Errors = {};
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("full_name")) e.full_name = t.auth.errors.required;
    if (!re.phone.test(normalizeDigits(v("phone")))) e.phone = t.auth.errors.phone;
    if (v("phone_alt") && !re.phone.test(normalizeDigits(v("phone_alt")))) e.phone_alt = t.auth.errors.phone;
    if (!re.email.test(v("email"))) e.email = t.auth.errors.email;
    if (String(fd.get("password") ?? "").length < 8) e.password = t.auth.errors.password;
    if (!re.nationalId.test(normalizeDigits(v("national_id")))) e.national_id = t.auth.errors.nationalId;
    if (v("tax_registration_number") && !re.tax.test(normalizeDigits(v("tax_registration_number"))))
      e.tax_registration_number = t.auth.errors.taxNumber;
    for (const k of ["id_front", "id_back"]) {
      const f = fd.get(k);
      if (!(f instanceof File) || f.size === 0) e[k] = t.auth.errors.idImages;
      else if (!ID_IMAGE_TYPES.includes(f.type) || f.size > MAX_ID_BYTES) e[k] = t.auth.errors.fileType;
    }
    if (!fd.get("consent")) e.consent = t.auth.errors.consent;
    return e;
  }

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setFormError("");
    const fd = new FormData(ev.currentTarget);
    const e = validate(fd);
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector(`[name="${Object.keys(e)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setLoading(true);
    try {
      // 1) رفع صورتي البطاقة مباشرة إلى Drive الخاص بالمكتب
      const tk = await getRegisterTicket();
      const [front, back] = await Promise.all([
        uploadDirect(tk, fd.get("id_front") as File),
        uploadDirect(tk, fd.get("id_back") as File),
      ]);
      // 2) إنشاء الحساب
      const input = Object.fromEntries(
        ["full_name", "phone", "phone_alt", "email", "password", "national_id", "tax_registration_number", "client_type", "company_name", "tax_office"].map((k) => [k, String(fd.get(k) ?? "")])
      ) as unknown as RegisterInput;
      input.consent = Boolean(fd.get("consent"));
      const res = await register(input, tk.ticket, front, back);
      if ("error" in res) {
        const msg = (t.auth.errors as Record<string, string>)[res.error ?? ""] ?? t.auth.errors.generic;
        if (res.field) setErrors({ [res.field]: msg });
        setFormError(msg);
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setFormError(t.auth.errors.generic);
      setLoading(false);
    }
  }

  function onImage(side: "front" | "back", f?: File) {
    setPreviews((p) => ({ ...p, [side]: f ? URL.createObjectURL(f) : undefined }));
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="field-error">{errors[k]}</p> : null);
  const Opt = () => <span className="text-xs font-normal text-slate-400"> ({t.auth.optional})</span>;
  const Req = () => <span className="text-red-500"> *</span>;

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-navy-900">{t.auth.registerTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.auth.registerSubtitle}</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-8">
        <fieldset>
          <legend className="mb-4 text-sm font-bold uppercase tracking-wide text-gold-600">{t.auth.sectionPersonal}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t.auth.fullName}<Req /></label>
              <input name="full_name" className="input" autoComplete="name" />
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
            <div>
              <label className="label">{t.auth.email}<Req /></label>
              <input name="email" type="email" className="input" dir="ltr" autoComplete="email" />
              <Err k="email" />
            </div>
            <div>
              <label className="label">{t.auth.password}<Req /></label>
              <input name="password" type="password" className="input" dir="ltr" autoComplete="new-password" placeholder={t.auth.passwordHint} />
              <Err k="password" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-sm font-bold uppercase tracking-wide text-gold-600">{t.auth.sectionIdentity}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t.auth.nationalId}<Req /></label>
              <input name="national_id" inputMode="numeric" maxLength={14} className="input tracking-widest" dir="ltr" placeholder="2XXXXXXXXXXXXX" />
              <Err k="national_id" />
            </div>
            {(["front", "back"] as const).map((side) => (
              <div key={side}>
                <label className="label">{side === "front" ? t.auth.idFront : t.auth.idBack}<Req /></label>
                <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 transition hover:border-navy-600 hover:bg-white">
                  {previews[side] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[side]} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <>
                      <Icon name="upload" className="h-7 w-7 text-slate-400" />
                      {t.auth.chooseFile}
                    </>
                  )}
                  <input
                    type="file"
                    name={`id_${side}`}
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => onImage(side, e.target.files?.[0])}
                  />
                </label>
                <Err k={`id_${side}`} />
              </div>
            ))}
            <p className="flex items-center gap-2 text-xs text-slate-500 sm:col-span-2">
              <Icon name="lock" className="h-4 w-4 text-gold-600" />
              {t.auth.secureNote}
            </p>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-sm font-bold uppercase tracking-wide text-gold-600">{t.auth.sectionBusiness}</legend>
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
              <input name="tax_registration_number" inputMode="numeric" maxLength={9} className="input tracking-widest" dir="ltr" placeholder="XXXXXXXXX" />
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
          </div>
        </fieldset>

        <div>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[#0b1f3a]" />
            {t.auth.consent}
          </label>
          <Err k="consent" />
        </div>

        {formError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

        <button type="submit" disabled={loading} className="btn-navy w-full py-3 text-base">
          {loading ? t.auth.submitting : t.auth.registerBtn}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-navy-700 hover:text-gold-600">{t.nav.login}</Link>
      </p>
    </div>
  );
}
