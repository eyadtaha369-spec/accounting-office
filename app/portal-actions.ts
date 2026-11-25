"use server";
import { getSession } from "@/lib/auth";
import { batch, insert, remove, select, update, type Row } from "@/lib/sheets";
import { downloadTicket, readTicket, uploadTicket, verifyReceipt, type UploadTicket } from "@/lib/tickets";
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from "@/lib/format";
import { normalizeDigits } from "@/lib/validation";
import { VAULT_KEYS } from "@/lib/vault";
import type { Uploaded } from "@/lib/direct";

const str = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ""));
const isUrl = (v: unknown) => /^https?:\/\/\S+$/i.test(String(v ?? "").trim());
const money = (v: unknown) => {
  const n = Number(normalizeDigits(String(v ?? "")).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? String(Math.round(n * 100) / 100) : "";
};

async function who() {
  const s = await getSession();
  if (!s) throw new Error("forbidden");
  return { ...s, staff: s.role !== "client" };
}

/** يحدد العميل المستهدف: العميل نفسه، أو أي عميل إذا كان المستخدم من فريق المكتب */
function target(s: { uid: string; staff: boolean }, clientId?: string) {
  if (!s.staff) return s.uid;
  if (!clientId) throw new Error("client required");
  return clientId;
}

function fileFromTicket(s: { uid: string }, ticket: string, up: Uploaded, clientId: string, purpose: string) {
  const t = readTicket<UploadTicket>(ticket);
  if (!t || t.folder !== "docs" || t.uid !== s.uid || t.clientId !== clientId || t.purpose !== purpose) return null;
  if (!verifyReceipt(ticket, up.fileId, up.receipt)) return null;
  if (!ALLOWED_DOC_TYPES.includes(up.mimeType) || up.size > MAX_DOC_BYTES) return null;
  return { id: up.fileId, name: str(up.name, 200), mime: up.mimeType };
}

/** تذكرة رفع: فواتير شهرية / إيصال دفع / مستند خزنة */
export async function getPortalTicket(purpose: "invoice" | "receipt" | "vault", clientId?: string) {
  const s = await who();
  if (purpose === "vault" && !s.staff) throw new Error("forbidden");
  const cid = target(s, clientId);
  return {
    url: process.env.APPS_SCRIPT_URL!,
    ticket: uploadTicket({ folder: "docs", prefix: `${purpose.toUpperCase()}-${cid.slice(0, 8)}`, uid: s.uid, clientId: cid, purpose }),
  };
}

// ======================= أرشيف الفواتير الشهرية =======================
export async function addInvoice(
  input: { clientId?: string; year: string; month: string; category: string; note?: string; link?: string },
  ticket?: string,
  up?: Uploaded
) {
  const s = await who();
  const cid = target(s, input.clientId);
  const year = Number(input.year), month = Number(input.month);
  if (!(year >= 2000 && year <= 2100) || !(month >= 1 && month <= 12)) return { ok: false as const };
  const category = input.category === "purchases" ? "purchases" : "sales";
  let file = null as null | { id: string; name: string; mime: string };
  if (ticket && up) {
    file = fileFromTicket(s, ticket, up, cid, "invoice");
    if (!file) return { ok: false as const };
  } else if (!isUrl(input.link)) return { ok: false as const };
  const row = await insert("MonthlyInvoices", {
    client_id: cid, year: String(year), month: String(month), category,
    drive_file_id: file?.id ?? "", file_name: file?.name ?? "", mime_type: file?.mime ?? "",
    link: file ? "" : str(input.link, 1000), note: str(input.note, 300), uploaded_by: s.uid,
  });
  return { ok: true as const, row, ticket: file ? downloadTicket(file.id) : "" };
}

export async function deleteInvoice(id: string) {
  const s = await who();
  const [row] = await select("MonthlyInvoices", { id });
  if (!row || (!s.staff && row.client_id !== s.uid)) return { ok: false as const };
  await remove("MonthlyInvoices", id);
  return { ok: true as const };
}

// ======================= كشف حساب الأتعاب =======================
const PAY_METHODS = ["instapay", "vodafone_cash", "bank_transfer", "cash"];

/** العميل يسجل دفعة (تذهب للمراجعة) — أو المكتب يسجل دفعة مستلمة (مؤكدة مباشرة) */
export async function submitPayment(
  input: { clientId?: string; amount: string; method: string; date: string; note?: string },
  ticket?: string,
  up?: Uploaded
) {
  const s = await who();
  const cid = target(s, input.clientId);
  const amount = money(input.amount);
  if (!amount || !isDate(input.date) || !PAY_METHODS.includes(input.method)) return { ok: false as const };
  let file = null as null | { id: string; name: string; mime: string };
  if (ticket && up) {
    file = fileFromTicket(s, ticket, up, cid, "receipt");
    if (!file) return { ok: false as const };
  }
  const row = await insert("BillingLedger", {
    client_id: cid, kind: "payment", title: "", amount, date: input.date,
    status: s.staff ? "confirmed" : "pending_review", method: input.method,
    receipt_file: file?.id ?? "", receipt_name: file?.name ?? "", note: str(input.note, 300), created_by: s.uid,
  });
  return { ok: true as const, row, ticket: file ? downloadTicket(file.id) : "" };
}

/** الأدمن يسجل أتعاباً مستحقة على العميل */
export async function addCharge(clientId: string, input: { title: string; amount: string; date: string; status: string }) {
  const s = await who();
  if (!s.staff) return { ok: false as const };
  const amount = money(input.amount);
  const title = str(input.title, 200);
  if (!amount || !title || !isDate(input.date)) return { ok: false as const };
  const row = await insert("BillingLedger", {
    client_id: clientId, kind: "charge", title, amount, date: input.date,
    status: input.status === "paid" ? "paid" : "due", method: "", receipt_file: "", receipt_name: "", note: "", created_by: s.uid,
  });
  return { ok: true as const, row };
}

export async function setLedgerStatus(id: string, status: string) {
  const s = await who();
  if (!s.staff || !["due", "paid", "pending_review", "confirmed", "rejected"].includes(status)) return { ok: false as const };
  const row = await update("BillingLedger", id, { status });
  return { ok: true as const, row };
}

export async function deleteLedger(id: string) {
  const s = await who();
  if (!s.staff) return { ok: false as const };
  await remove("BillingLedger", id);
  return { ok: true as const };
}

// ======================= خزنة المستندات + صورة التوكيل =======================
const VAULT_COLS = [...VAULT_KEYS.map((k) => `vault_${k}`), "poa_file"];

export async function setVaultItem(clientId: string, key: string, input: { link?: string }, ticket?: string, up?: Uploaded) {
  const s = await who();
  if (!s.staff) return { ok: false as const };
  const col = key === "poa" ? "poa_file" : `vault_${key}`;
  if (!VAULT_COLS.includes(col)) return { ok: false as const };
  let value = "";
  let tk = "";
  if (ticket && up) {
    const file = fileFromTicket(s, ticket, up, clientId, "vault");
    if (!file) return { ok: false as const };
    value = `drive:${file.id}|${file.name.replace(/\|/g, " ")}`;
    tk = downloadTicket(file.id);
  } else if (isUrl(input.link)) {
    value = `url:${str(input.link, 1000)}`;
  } else return { ok: false as const };
  await update("Users", clientId, { [col]: value });
  return { ok: true as const, col, value, ticket: tk, fileId: up?.fileId ?? "" };
}

export async function clearVaultItem(clientId: string, key: string) {
  const s = await who();
  if (!s.staff) return { ok: false as const };
  const col = key === "poa" ? "poa_file" : `vault_${key}`;
  if (!VAULT_COLS.includes(col)) return { ok: false as const };
  await update("Users", clientId, { [col]: "" });
  return { ok: true as const };
}

/** بيانات التوكيل وتواريخ انتهاء السجل/البطاقة (فريق المكتب) */
export async function updateCompliance(clientId: string, input: Row) {
  const s = await who();
  if (!s.staff) return { ok: false as const };
  const patch: Row = {
    cr_expiry: isDate(input.cr_expiry) ? input.cr_expiry : "",
    tax_card_expiry: isDate(input.tax_card_expiry) ? input.tax_card_expiry : "",
    poa_has: input.poa_has === "yes" ? "yes" : input.poa_has === "no" ? "no" : "",
    poa_number: str(input.poa_number, 60),
    poa_letter_year: str(input.poa_letter_year, 60),
    poa_office: str(input.poa_office, 150),
  };
  await batch([{ op: "update", table: "Users", id: clientId, patch }]);
  return { ok: true as const, patch };
}
