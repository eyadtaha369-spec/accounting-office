import "server-only";
import { CLIENT_TYPES } from "./i18n";
import { normalizeDigits, re } from "./validation";

export type ClientFields = Record<
  "full_name" | "phone" | "phone_alt" | "email" | "password" | "national_id" | "tax_registration_number" | "client_type" | "company_name" | "tax_office" | "address",
  string
>;

/** تنظيف والتحقق من بيانات العميل — مشترك بين التسجيل الذاتي وإضافة الأدمن */
export function cleanClient(input: Partial<ClientFields>) {
  const d = {
    full_name: String(input.full_name ?? "").trim().slice(0, 150),
    phone: normalizeDigits(String(input.phone ?? "")),
    phone_alt: normalizeDigits(String(input.phone_alt ?? "")),
    email: String(input.email ?? "").trim().toLowerCase(),
    password: String(input.password ?? ""),
    national_id: normalizeDigits(String(input.national_id ?? "")),
    tax_registration_number: normalizeDigits(String(input.tax_registration_number ?? "")),
    client_type: String(input.client_type ?? ""),
    company_name: String(input.company_name ?? "").trim().slice(0, 200),
    tax_office: String(input.tax_office ?? "").trim().slice(0, 150),
    address: String(input.address ?? "").trim().slice(0, 300),
  };
  let error: { error: string; field?: string } | null = null;
  if (!d.full_name) error = { error: "required", field: "full_name" };
  else if (!re.phone.test(d.phone)) error = { error: "phone", field: "phone" };
  else if (d.phone_alt && !re.phone.test(d.phone_alt)) error = { error: "phone", field: "phone_alt" };
  else if (!re.email.test(d.email)) error = { error: "email", field: "email" };
  else if (d.password.length < 8) error = { error: "password", field: "password" };
  else if (!re.nationalId.test(d.national_id)) error = { error: "nationalId", field: "national_id" };
  else if (d.tax_registration_number && !re.tax.test(d.tax_registration_number)) error = { error: "taxNumber", field: "tax_registration_number" };
  else if (!(CLIENT_TYPES as readonly string[]).includes(d.client_type)) error = { error: "generic" };
  return { d, error };
}
