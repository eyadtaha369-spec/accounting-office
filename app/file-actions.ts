"use server";
import { requireLogin } from "@/lib/auth";
import { batch, select, type Op } from "@/lib/sheets";
import { setRequestStatus, type Request } from "@/lib/db";
import { downloadTicket, readTicket, uploadTicket, verifyReceipt, type UploadTicket } from "@/lib/tickets";
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from "@/lib/format";
import type { Uploaded } from "@/lib/direct";

/** تذكرة رفع لطلب معيّن: العميل يرفع مرفقاته، والمكتب يرفع الملف النهائي */
export async function getRequestUploadTicket(requestId: string) {
  const s = await requireLogin();
  const [req] = (await select("Requests", { id: requestId })) as unknown as Request[];
  if (!req) throw new Error("not_found");
  const isStaff = s.role !== "client";
  if (!isStaff) throw new Error("read_only"); // العميل لا يرفع ملفات
  return {
    url: process.env.APPS_SCRIPT_URL!,
    ticket: uploadTicket({
      folder: "requests",
      prefix: `REQ-${req.reference_no}`,
      uid: s.uid,
      requestId: req.id,
      clientId: req.client_id,
      kind: isStaff ? "office_deliverable" : "client_attachment",
    }),
  };
}

/** تسجيل الملفات بعد رفعها — يتحقق أن Apps Script هو من أنشأها بنفس التذكرة */
export async function registerUploads(ticket: string, uploads: Uploaded[]) {
  const s = await requireLogin();
  if (s.role === "client") throw new Error("read_only");
  const t = readTicket<UploadTicket>(ticket);
  if (!t || t.folder !== "requests" || t.uid !== s.uid || !t.requestId || !t.clientId || !t.kind) throw new Error("invalid_ticket");
  const ops: Op[] = [];
  for (const u of uploads) {
    if (!verifyReceipt(ticket, u.fileId, u.receipt)) throw new Error("invalid_receipt");
    if (!ALLOWED_DOC_TYPES.includes(u.mimeType) || u.size > MAX_DOC_BYTES) continue;
    ops.push({
      op: "insert",
      table: "Files",
      row: {
        request_id: t.requestId,
        client_id: t.clientId,
        uploaded_by: s.uid,
        kind: t.kind,
        drive_file_id: u.fileId,
        file_name: String(u.name).slice(0, 200),
        mime_type: u.mimeType,
        size_bytes: String(u.size),
      },
    });
  }
  const rows = (ops.length ? await batch(ops) : []) as Record<string, string>[];
  const tickets: Record<string, string> = {};
  for (const r of rows) tickets[r.drive_file_id] = downloadTicket(r.drive_file_id);
  return { ok: true as const, rows, tickets };
}

/** العميل يعيد إرسال الطلب بعد رفع المستندات المطلوبة */
export async function resubmitRequest(requestId: string) {
  const s = await requireLogin();
  if (s.role === "client") return { ok: false as const };
  const [req] = (await select("Requests", { id: requestId })) as unknown as Request[];
  if (!req || req.client_id !== s.uid || req.status !== "needs_documents") return { ok: false as const };
  const res = await setRequestStatus(req, "pending_review", req.admin_message, s.uid);
  return { ok: true as const, ...res };
}
