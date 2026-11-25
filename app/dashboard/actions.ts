"use server";
import { requireLogin } from "@/lib/auth";
import { batch, update } from "@/lib/sheets";
import { uploadTicket } from "@/lib/tickets";
import { CLIENT_TYPES, REQUEST_TYPES, TAX_RETURN_TYPES } from "@/lib/i18n";
import { normalizeDigits, re } from "@/lib/validation";

export async function createRequest(type: string, sub: string | null, description: string) {
  const s = await requireLogin();
  if (s.role !== "client") throw new Error("forbidden");
  if (!(REQUEST_TYPES as readonly string[]).includes(type)) return { error: "generic" };
  const subType = type === "tax_return" && (TAX_RETURN_TYPES as readonly string[]).includes(sub ?? "") ? sub! : "";
  const desc = String(description ?? "").trim().slice(0, 4000);
  if (type === "other" && !desc) return { error: "desc" };

  const id = crypto.randomUUID();
  const [req, history] = (await batch([
    { op: "insert", table: "Requests", row: { id, client_id: s.uid, request_type: type, sub_type: subType, description: desc, status: "pending_review" } },
    { op: "insert", table: "StatusHistory", row: { request_id: id, old_status: "", new_status: "pending_review", changed_by: s.uid } },
  ])) as [Record<string, string>, Record<string, string>];
  return {
    id,
    request: req,
    history,
    upload: {
      url: process.env.APPS_SCRIPT_URL!,
      ticket: uploadTicket({ folder: "requests", prefix: `REQ-${req.reference_no}`, uid: s.uid, requestId: id, clientId: s.uid, kind: "client_attachment" }),
    },
  };
}

export async function updateProfile(input: Record<string, string>) {
  const s = await requireLogin();
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
