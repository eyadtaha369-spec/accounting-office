"use server";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { batch, insert, select, type Row } from "@/lib/sheets";
import { hashPassword } from "@/lib/password";
import { cleanClient, type ClientFields } from "@/lib/client-input";
import { downloadTicket, readTicket, uploadTicket, verifyReceipt, type UploadTicket } from "@/lib/tickets";
import { setRequestStatus, type Request } from "@/lib/db";
import { REQUEST_TYPES, STATUSES, TAX_RETURN_TYPES, type Status } from "@/lib/i18n";
import type { Uploaded } from "@/lib/direct";

type Portal = "tax_portal" | "e_invoice";
const PORTALS: Portal[] = ["tax_portal", "e_invoice"];
const strip = ({ password_hash, ...u }: Row) => (void password_hash, u);

/** تغيير حالة الطلب — يرجع الطلب المحدَّث وسطر سجل الحالة */
export async function updateRequest(requestId: string, status: Status, message: string) {
  const s = await requireStaff();
  if (!STATUSES.includes(status)) return { ok: false as const };
  if (status === "needs_documents" && !message.trim()) return { ok: false as const };
  const [req] = (await select("Requests", { id: requestId })) as unknown as Request[];
  if (!req) return { ok: false as const };
  const res = await setRequestStatus(req, status, message.trim().slice(0, 4000), s.uid, { assigned_to: s.uid });
  return { ok: true as const, ...res };
}

export async function saveCredentials(clientId: string, portal: Portal, username: string, password: string) {
  const s = await requireAdmin();
  if (!PORTALS.includes(portal)) return { ok: false as const };
  await batch([
    {
      op: "upsert",
      table: "Credentials",
      row: {
        id: `${clientId}:${portal}`,
        client_id: clientId,
        portal,
        username_enc: username.trim() ? encrypt(username.trim()) : "",
        password_enc: password ? encrypt(password) : "",
        updated_by: s.uid,
      },
    },
  ]);
  return { ok: true };
}

export async function revealCredentials(clientId: string, portal: Portal) {
  await requireAdmin();
  const [row] = await select("Credentials", { id: `${clientId}:${portal}` });
  if (!row) return { username: "", password: "" };
  return {
    username: row.username_enc ? decrypt(row.username_enc) : "",
    password: row.password_enc ? decrypt(row.password_enc) : "",
  };
}

export async function addInternalNote(clientId: string, body: string) {
  const s = await requireStaff();
  if (!body.trim()) return { ok: false as const };
  const note = await insert("Notes", { client_id: clientId, body: body.trim().slice(0, 4000), author_id: s.uid, author_name: s.name });
  return { ok: true as const, note };
}

// ======================= إضافة عميل بواسطة الأدمن =======================

export async function getAdminIdTicket() {
  const s = await requireStaff();
  return { url: process.env.APPS_SCRIPT_URL!, ticket: uploadTicket({ folder: "ids", prefix: `admin-${crypto.randomUUID()}`, uid: s.uid }) };
}

type IdUpload = { ticket: string; front?: Uploaded; back?: Uploaded } | null;

function checkIdUpload(s: { uid: string }, ids: IdUpload) {
  if (!ids) return { front: "", back: "" };
  const t = readTicket<UploadTicket>(ids.ticket);
  if (!t || t.folder !== "ids" || t.uid !== s.uid) return null;
  for (const f of [ids.front, ids.back]) if (f && !verifyReceipt(ids.ticket, f.fileId, f.receipt)) return null;
  return { front: ids.front?.fileId ?? "", back: ids.back?.fileId ?? "" };
}

/** إنشاء حساب عميل مفعّل فوراً — لا يؤثر على جلسة الأدمن */
export async function adminCreateClient(input: ClientFields, ids: IdUpload) {
  const s = await requireStaff();
  const { d, error } = cleanClient(input);
  if (error) return error;
  const files = checkIdUpload(s, ids);
  if (!files) return { error: "idImages", field: "id_front" };

  const [byEmail, byId] = (await batch([
    { op: "select", table: "Users", where: { email: d.email } },
    { op: "select", table: "Users", where: { national_id: d.national_id } },
  ])) as [Row[], Row[]];
  if (byEmail.length) return { error: "duplicateEmail", field: "email" };
  if (byId.length) return { error: "duplicateId", field: "national_id" };

  const { password, ...rest } = d;
  const id = crypto.randomUUID();
  const [user, note] = (await batch([
    {
      op: "insert",
      table: "Users",
      row: { ...rest, id, role: "client", file_status: "active", password_hash: hashPassword(password), id_front_file: files.front, id_back_file: files.back },
    },
    { op: "insert", table: "Notes", row: { client_id: id, body: "تم إنشاء الحساب بواسطة المكتب", author_id: s.uid, author_name: s.name } },
  ])) as [Row, Row];
  const tickets: Record<string, string> = {};
  for (const f of [files.front, files.back]) if (f) tickets[f] = downloadTicket(f);
  return { ok: true as const, id, user: strip(user), note, tickets };
}

export async function adminResetPassword(clientId: string, password: string) {
  const s = await requireStaff();
  if (String(password).length < 8) return { ok: false as const };
  const [u] = await select("Users", { id: clientId });
  if (!u || u.role !== "client") return { ok: false as const };
  const [, note] = (await batch([
    { op: "update", table: "Users", id: clientId, patch: { password_hash: hashPassword(password) } },
    { op: "insert", table: "Notes", row: { client_id: clientId, body: "تم تعيين كلمة مرور جديدة بواسطة المكتب", author_id: s.uid, author_name: s.name } },
  ])) as [Row, Row];
  return { ok: true as const, note };
}

/** إضافة طلب (سابق أو جديد) للعميل من صفحة الأدمن */
export async function adminCreateRequest(clientId: string, input: { type: string; sub: string; description: string; status: Status; message: string; date: string }) {
  const s = await requireStaff();
  if (!(REQUEST_TYPES as readonly string[]).includes(input.type) || !STATUSES.includes(input.status)) return { error: "generic" };
  const desc = String(input.description ?? "").trim().slice(0, 4000);
  if (input.type === "other" && !desc) return { error: "desc" };
  const sub = input.type === "tax_return" && (TAX_RETURN_TYPES as readonly string[]).includes(input.sub) ? input.sub : "";

  const now = new Date();
  let created = now;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    const d = new Date(`${input.date}T09:00:00Z`);
    if (!isNaN(d.getTime()) && d < now) created = d;
  }
  const createdIso = created.toISOString();
  const id = crypto.randomUUID();
  const message = String(input.message ?? "").trim().slice(0, 4000);

  const [req, history] = (await batch([
    {
      op: "insert",
      table: "Requests",
      row: {
        id, client_id: clientId, request_type: input.type, sub_type: sub, description: desc, status: input.status,
        admin_message: message, assigned_to: s.uid, completed_at: input.status === "completed" ? createdIso : "", created_at: createdIso,
      },
    },
    { op: "insert", table: "StatusHistory", row: { request_id: id, old_status: "", new_status: input.status, message, changed_by: s.uid, created_at: createdIso } },
  ])) as [Row, Row];

  return {
    id,
    request: req,
    history,
    upload: {
      url: process.env.APPS_SCRIPT_URL!,
      ticket: uploadTicket({ folder: "requests", prefix: `REQ-${req.reference_no}`, uid: s.uid, requestId: id, clientId, kind: "office_deliverable" }),
    },
  };
}
