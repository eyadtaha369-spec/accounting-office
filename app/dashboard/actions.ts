"use server";
import { requireLogin } from "@/lib/auth";
import { batch, update } from "@/lib/sheets";
import { uploadTicket } from "@/lib/tickets";
import { CLIENT_TYPES, REQUEST_TYPES, TAX_RETURN_TYPES } from "@/lib/i18n";
import { normalizeDigits, re } from "@/lib/validation";

/** بوابة العميل للعرض والتحميل فقط — الطلبات يسجلها المكتب من ملف العميل */
export async function createRequest(type: string, sub: string | null, description: string) {
  await requireLogin();
  void type; void sub; void description;
  return { error: "read_only" as const };
}

export async function updateProfile(input: Record<string, string>) {
  const s = await requireLogin();
  if (s.role === "client") return { error: "read_only" as const };
  const phone = normalizeDigits(String(input.phone ?? ""));
  const phone_alt = normalizeDigits(String(input.phone_alt ?? ""));
  const tax = normalizeDigits(String(input.tax_registration_number ?? ""));
  if (!re.phone.test(phone) || (phone_alt && !re.phone.test(phone_alt))) return { error: "phone" };
  if (tax && !re.tax.test(tax)) return { error: "taxNumber" };
  const client_type = (CLIENT_TYPES as readonly string[]).includes(input.client_type) ? input.client_type : "individual";
  // الاسم والبريد والرقم القومي وصور البطاقة لا تُعدّل من هنا
  const saved = await update("Users", s.uid, {
    phone,
    phone_alt,
    tax_registration_number: tax,
    client_type,
    company_name: String(input.company_name ?? "").trim().slice(0, 200),
    tax_office: String(input.tax_office ?? "").trim().slice(0, 150),
    address: String(input.address ?? "").trim().slice(0, 300),
  });
  const { password_hash, ...user } = saved;
  void password_hash;
  return { ok: true as const, user };
}
