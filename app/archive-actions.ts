"use server";
import { requireStaff } from "@/lib/auth";
import { batch, insert, remove, update, type Row } from "@/lib/sheets";
import { downloadTicket, readTicket, uploadTicket, verifyReceipt, type UploadTicket } from "@/lib/tickets";
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES } from "@/lib/format";
import { ARCHIVE_SECTIONS, serializeServices } from "@/lib/services";
import type { Uploaded } from "@/lib/direct";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
const okYear = (y: unknown) => /^(19|20)\d{2}$/.test(String(y ?? ""));
const vis = (v: boolean) => (v ? "yes" : "no");

/** إنشاء/إظهار/إخفاء مجلد سنة (id = clientId:year) */
export async function setYearVisibility(clientId: string, year: string, visible: boolean) {
  await requireStaff();
  if (!okYear(year)) return { ok: false as const };
  const [row] = (await batch([
    { op: "upsert", table: "ArchiveYears", row: { id: `${clientId}:${year}`, client_id: clientId, year, is_visible: vis(visible) } },
  ])) as Row[];
  return { ok: true as const, row };
}

export async function getArchiveTicket(clientId: string) {
  const s = await requireStaff();
  return {
    url: process.env.APPS_SCRIPT_URL!,
    ticket: uploadTicket({ folder: "docs", prefix: `ARCHIVE-${clientId.slice(0, 8)}`, uid: s.uid, clientId, purpose: "archive" }),
  };
}

/** إضافة مستند للأرشيف (ملف مرفوع أو رابط) باسم مخصص */
export async function addArchiveDoc(
  clientId: string,
  input: { year: string; section: string; title: string; visible: boolean; link?: string },
  ticket?: string,
  up?: Uploaded
) {
  const s = await requireStaff();
  if (!okYear(input.year)) return { ok: false as const };
  const section = (ARCHIVE_SECTIONS as readonly string[]).includes(input.section) ? input.section : "general";
  const title = str(input.title, 200);
  let file: { id: string; name: string; mime: string } | null = null;
  if (ticket && up) {
    const t = readTicket<UploadTicket>(ticket);
    if (!t || t.folder !== "docs" || t.uid !== s.uid || t.clientId !== clientId || t.purpose !== "archive") return { ok: false as const };
    if (!verifyReceipt(ticket, up.fileId, up.receipt)) return { ok: false as const };
    if (!ALLOWED_DOC_TYPES.includes(up.mimeType) || up.size > MAX_DOC_BYTES) return { ok: false as const };
    file = { id: up.fileId, name: str(up.name, 200), mime: up.mimeType };
  } else if (!/^https?:\/\/\S+$/i.test(String(input.link ?? "").trim())) return { ok: false as const };

  const [doc, yearRow] = (await batch([
    {
      op: "insert",
      table: "ArchiveDocs",
      row: {
        client_id: clientId, year: input.year, section, title: title || file?.name || "مستند",
        drive_file_id: file?.id ?? "", file_name: file?.name ?? "", mime_type: file?.mime ?? "",
        link: file ? "" : str(input.link, 1000), is_visible: vis(input.visible), uploaded_by: s.uid,
      },
    },
    // يضمن وجود مجلد السنة (بدون تغيير حالة إظهاره إن كان موجوداً)
    { op: "select", table: "ArchiveYears", where: { id: `${clientId}:${input.year}` } },
  ])) as [Row, Row[]];
  let year = yearRow[0];
  if (!year) year = await insert("ArchiveYears", { id: `${clientId}:${input.year}`, client_id: clientId, year: input.year, is_visible: "yes" });
  return { ok: true as const, doc, year, ticket: file ? downloadTicket(file.id) : "" };
}

export async function setDocVisibility(id: string, visible: boolean) {
  await requireStaff();
  const row = await update("ArchiveDocs", id, { is_visible: vis(visible) });
  return { ok: true as const, row };
}

export async function renameArchiveDoc(id: string, title: string) {
  await requireStaff();
  const t = str(title, 200);
  if (!t) return { ok: false as const };
  const row = await update("ArchiveDocs", id, { title: t });
  return { ok: true as const, row };
}

export async function deleteArchiveDoc(id: string) {
  await requireStaff();
  await remove("ArchiveDocs", id);
  return { ok: true as const };
}

/** تفعيل/إلغاء خدمات العميل (تحدد الصفحات الظاهرة له) */
export async function setClientServices(clientId: string, services: string[]) {
  await requireStaff();
  const row = await update("Users", clientId, { services: serializeServices(services) });
  const { password_hash, ...user } = row;
  void password_hash;
  return { ok: true as const, user };
}
