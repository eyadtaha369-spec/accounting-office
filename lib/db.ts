import "server-only";
import { cache } from "react";
import { batch, select, type Op, type Row } from "./sheets";
import type { Status } from "./i18n";

export type Profile = {
  id: string;
  role: "client" | "staff" | "admin";
  full_name: string;
  email: string;
  phone: string;
  phone_alt: string;
  national_id: string;
  id_front_file: string;
  id_back_file: string;
  tax_registration_number: string;
  client_type: string;
  company_name: string;
  tax_office: string;
  created_at: string;
};

export type Request = {
  id: string;
  reference_no: string;
  client_id: string;
  request_type: string;
  sub_type: string;
  description: string;
  status: Status;
  admin_message: string;
  assigned_to: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
};

export type FileRow = {
  id: string;
  request_id: string;
  client_id: string;
  uploaded_by: string;
  kind: "client_attachment" | "office_deliverable";
  drive_file_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: string;
  created_at: string;
};

export type HistoryRow = { id: string; request_id: string; old_status: string; new_status: Status; message: string; changed_by: string; created_at: string };
export type NoteRow = { id: string; client_id: string; body: string; author_id: string; author_name: string; created_at: string };

export function toProfile(r: Row): Profile {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, updated_at, ...rest } = r;
  return rest as unknown as Profile;
}

const byDateDesc = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at);
const byDateAsc = <T extends { created_at: string }>(a: T, b: T) => a.created_at.localeCompare(b.created_at);

export const getUser = cache(async (id: string) => {
  const [u] = await select("Users", { id });
  return u ? toProfile(u) : null;
});

export async function getUserRowByEmail(email: string) {
  const [u] = await select("Users", { email: email.toLowerCase() });
  return u ?? null;
}

// ---------- العميل ----------
export async function clientRequests(clientId: string) {
  const rows = (await select("Requests", { client_id: clientId })) as unknown as Request[];
  return rows.sort(byDateDesc);
}

export async function requestBundle(requestId: string) {
  const [req, files, history] = (await batch([
    { op: "select", table: "Requests", where: { id: requestId } },
    { op: "select", table: "Files", where: { request_id: requestId } },
    { op: "select", table: "StatusHistory", where: { request_id: requestId } },
  ])) as [Request[], FileRow[], HistoryRow[]];
  if (!req[0]) return null;
  return { request: req[0], files: files.sort(byDateAsc), history: history.sort(byDateAsc) };
}

/** يغيّر حالة الطلب ويسجّل التغيير في سجل الحالات (عملية واحدة) */
export async function setRequestStatus(req: Request, status: Status, message: string | null, by: string, extra: Partial<Request> = {}) {
  const patch: Row = { status, ...(extra as Row) };
  if (message !== undefined) patch.admin_message = message ?? "";
  if (status !== req.status) patch.completed_at = status === "completed" ? new Date().toISOString() : "";
  const ops: Op[] = [{ op: "update", table: "Requests", id: req.id, patch }];
  if (status !== req.status) {
    ops.push({
      op: "insert",
      table: "StatusHistory",
      row: { request_id: req.id, old_status: req.status, new_status: status, message: message ?? "", changed_by: by },
    });
  }
  await batch(ops);
}

// ---------- الإدارة ----------
export async function adminOverview() {
  const [users, requests] = (await batch([
    { op: "select", table: "Users", where: { role: "client" } },
    { op: "select", table: "Requests" },
  ])) as [Row[], Request[]];
  return { clients: users.map(toProfile), requests };
}

export async function clientBundle(clientId: string) {
  const [users, requests, notes, creds] = (await batch([
    { op: "select", table: "Users", where: { id: clientId } },
    { op: "select", table: "Requests", where: { client_id: clientId } },
    { op: "select", table: "Notes", where: { client_id: clientId } },
    { op: "select", table: "Credentials", where: { client_id: clientId } },
  ])) as [Row[], Request[], NoteRow[], Row[]];
  if (!users[0]) return null;
  return {
    client: toProfile(users[0]),
    requests: requests.sort(byDateDesc),
    notes: notes.sort(byDateDesc),
    savedPortals: new Set(creds.filter((c) => c.username_enc || c.password_enc).map((c) => c.portal)),
  };
}

/** يربط كل طلب ببيانات العميل لعرضه في الجداول */
export function withClients(requests: Request[], clients: Profile[]) {
  const map = new Map(clients.map((c) => [c.id, c]));
  return requests.map((r) => {
    const c = map.get(r.client_id);
    return { ...r, client: c ? { id: c.id, full_name: c.full_name, phone: c.phone } : null };
  });
}
