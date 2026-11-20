"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { batch, insert, remove, select, update, type Row } from "@/lib/sheets";
import { readTicket, uploadTicket, verifyReceipt, type UploadTicket } from "@/lib/tickets";
import { normalizeDigits, re } from "@/lib/validation";
import {
  CLIENT_TYPES, DOC_CATEGORIES, FILE_STATUSES, FIN_CATEGORIES, FIN_METHODS, RECORD_SERVICES, RECORD_STATUSES, TASK_PRIORITIES,
} from "@/lib/i18n";
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from "@/lib/format";
import type { Uploaded } from "@/lib/direct";

const str = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);
const oneOf = <T extends readonly string[]>(list: T, v: unknown, def: T[number]) => ((list as readonly string[]).includes(String(v)) ? String(v) : def);
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ""));
const money = (v: unknown) => {
  const n = Number(normalizeDigits(String(v ?? "")).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? String(Math.round(n * 100) / 100) : "";
};

function refresh(...paths: string[]) {
  for (const p of ["/admin", ...paths]) revalidatePath(p);
}

// ---------------- سجلات الخدمات ----------------
export async function saveRecord(input: Row) {
  const s = await requireStaff();
  if (!input.client_id) return { ok: false };
  const row: Row = {
    client_id: str(input.client_id, 60),
    service: oneOf(RECORD_SERVICES, input.service, "vat"),
    period: str(input.period, 60),
    due_date: isDate(input.due_date) ? input.due_date : "",
    status: oneOf(RECORD_STATUSES, input.status, "pending"),
    amount: money(input.amount),
    reference: str(input.reference, 100),
    notes: str(input.notes, 2000),
  };
  if (input.id) await update("ServiceRecords", input.id, row);
  else await insert("ServiceRecords", { ...row, created_by: s.uid });
  refresh("/admin/records", `/admin/clients/${row.client_id}`);
  return { ok: true };
}

export async function deleteRecord(id: string) {
  await requireStaff();
  await remove("ServiceRecords", id);
  refresh("/admin/records");
  return { ok: true };
}

// ---------------- المهام ----------------
export async function saveTask(input: Row) {
  const s = await requireStaff();
  const title = str(input.title, 200);
  if (!title) return { ok: false };
  const row: Row = {
    title,
    client_id: str(input.client_id, 60),
    due_date: isDate(input.due_date) ? input.due_date : "",
    priority: oneOf(TASK_PRIORITIES, input.priority, "normal"),
    assigned_to: str(input.assigned_to, 100),
    notes: str(input.notes, 2000),
  };
  if (input.id) await update("Tasks", input.id, row);
  else await insert("Tasks", { ...row, status: "open", created_by: s.uid });
  refresh("/admin/tasks", row.client_id ? `/admin/clients/${row.client_id}` : "/admin/tasks");
  return { ok: true };
}

export async function setTaskStatus(id: string, done: boolean) {
  await requireStaff();
  await update("Tasks", id, { status: done ? "done" : "open" });
  refresh("/admin/tasks");
  return { ok: true };
}

export async function deleteTask(id: string) {
  await requireStaff();
  await remove("Tasks", id);
  refresh("/admin/tasks");
  return { ok: true };
}

// ---------------- الحسابات المالية (للأدمن فقط) ----------------
export async function saveFinance(input: Row) {
  const s = await requireAdmin();
  const amount = money(input.amount);
  if (!amount || Number(amount) <= 0 || !isDate(input.date)) return { ok: false };
  const row: Row = {
    type: input.type === "expense" ? "expense" : "income",
    category: oneOf(FIN_CATEGORIES, input.category, "other"),
    amount,
    date: input.date,
    client_id: str(input.client_id, 60),
    description: str(input.description, 500),
    method: oneOf(FIN_METHODS, input.method, "cash"),
  };
  if (input.id) await update("Finance", input.id, row);
  else await insert("Finance", { ...row, created_by: s.uid });
  refresh("/admin/finance");
  return { ok: true };
}

export async function deleteFinance(id: string) {
  await requireAdmin();
  await remove("Finance", id);
  refresh("/admin/finance");
  return { ok: true };
}

// ---------------- أرشيف المستندات ----------------
export async function getDocTicket(clientId: string) {
  const s = await requireStaff();
  return { url: process.env.APPS_SCRIPT_URL!, ticket: uploadTicket({ folder: "docs", prefix: `DOC-${clientId.slice(0, 8)}`, uid: s.uid, clientId }) };
}

export async function registerDocument(ticket: string, up: Uploaded, meta: { title: string; category: string; visible: boolean }) {
  const s = await requireStaff();
  const t = readTicket<UploadTicket>(ticket);
  if (!t || t.folder !== "docs" || t.uid !== s.uid || !t.clientId || !verifyReceipt(ticket, up.fileId, up.receipt)) return { ok: false };
  if (!ALLOWED_DOC_TYPES.includes(up.mimeType) || up.size > MAX_DOC_BYTES) return { ok: false };
  await insert("Documents", {
    client_id: t.clientId,
    title: str(meta.title, 200) || up.name,
    category: oneOf(DOC_CATEGORIES, meta.category, "other"),
    drive_file_id: up.fileId,
    file_name: str(up.name, 200),
    mime_type: up.mimeType,
    size_bytes: String(up.size),
    visible_to_client: meta.visible ? "yes" : "no",
    uploaded_by: s.uid,
  });
  refresh("/admin/documents", `/admin/clients/${t.clientId}`, "/dashboard/profile");
  return { ok: true };
}

export async function deleteDocument(id: string) {
  await requireStaff();
  await remove("Documents", id);
  refresh("/admin/documents");
  return { ok: true };
}

// ---------------- تعديل بيانات العميل بواسطة المكتب ----------------
export async function updateClientByStaff(clientId: string, input: Row) {
  await requireStaff();
  const [u] = await select("Users", { id: clientId });
  if (!u || u.role !== "client") return { ok: false, error: "generic" };
  const phone = normalizeDigits(str(input.phone));
  const phone_alt = normalizeDigits(str(input.phone_alt));
  const tax = normalizeDigits(str(input.tax_registration_number));
  const name = str(input.full_name, 150);
  if (!name) return { ok: false, error: "required" };
  if (!re.phone.test(phone) || (phone_alt && !re.phone.test(phone_alt))) return { ok: false, error: "phone" };
  if (tax && !re.tax.test(tax)) return { ok: false, error: "taxNumber" };
  await batch([
    {
      op: "update",
      table: "Users",
      id: clientId,
      patch: {
        full_name: name,
        phone,
        phone_alt,
        tax_registration_number: tax,
        client_type: oneOf(CLIENT_TYPES, input.client_type, "individual"),
        company_name: str(input.company_name, 200),
        tax_office: str(input.tax_office, 150),
        address: str(input.address, 300),
        file_status: oneOf(FILE_STATUSES, input.file_status, "active"),
      },
    },
  ]);
  refresh(`/admin/clients/${clientId}`, "/admin/clients");
  return { ok: true };
}
