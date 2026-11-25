"use server";
import { getSession } from "@/lib/auth";
import { snapshot, type Row } from "@/lib/sheets";
import { downloadTicket } from "@/lib/tickets";
import type { AdminData, ClientData, SnapshotResult } from "@/lib/store-types";

const strip = ({ password_hash, ...u }: Row) => (void password_hash, u);

function sign(ids: (string | undefined)[]) {
  const t: Record<string, string> = {};
  for (const id of ids) if (id && !t[id]) t[id] = downloadTicket(id);
  return t;
}

/** لقطة لوحة الإدارة: طلب واحد لـ Google Sheets لكل البيانات */
export async function loadAdminSnapshot(known?: string): Promise<SnapshotResult<AdminData>> {
  const s = await getSession();
  if (!s || s.role === "client") throw new Error("forbidden");
  const isAdmin = s.role === "admin";
  const tables = ["Users", "Requests", "Files", "StatusHistory", "Notes", "ServiceRecords", "Tasks", "Documents", "Credentials", ...(isAdmin ? ["Finance"] : [])];
  const snap = await snapshot(tables, known);
  if (snap.unchanged) return { unchanged: true, version: snap.version };
  const t = snap.tables ?? {};
  const users = (t.Users ?? []).map(strip);
  const data: AdminData = {
    Users: users,
    Requests: t.Requests ?? [],
    Files: t.Files ?? [],
    StatusHistory: t.StatusHistory ?? [],
    Notes: t.Notes ?? [],
    ServiceRecords: t.ServiceRecords ?? [],
    Tasks: t.Tasks ?? [],
    Finance: isAdmin ? t.Finance ?? [] : [],
    Documents: t.Documents ?? [],
    Portals: isAdmin ? (t.Credentials ?? []).filter((c) => c.username_enc || c.password_enc).map((c) => ({ client_id: c.client_id, portal: c.portal })) : [],
  };
  const tickets = sign([
    ...data.Files.map((f) => f.drive_file_id),
    ...data.Documents.map((d) => d.drive_file_id),
    ...users.flatMap((u) => [u.id_front_file, u.id_back_file]),
  ]);
  return { unchanged: false, version: snap.version, data, tickets, ticketsAt: Date.now(), url: process.env.APPS_SCRIPT_URL! };
}

/** لقطة العميل: بياناته فقط (التصفية تتم في الخادم) */
export async function loadClientSnapshot(known?: string): Promise<SnapshotResult<ClientData>> {
  const s = await getSession();
  if (!s) throw new Error("forbidden");
  const snap = await snapshot(["Users", "Requests", "Files", "StatusHistory", "Documents"], known);
  if (snap.unchanged) return { unchanged: true, version: snap.version };
  const t = snap.tables ?? {};
  const me = (t.Users ?? []).find((u) => u.id === s.uid);
  const requests = (t.Requests ?? []).filter((r) => r.client_id === s.uid);
  const ids = new Set(requests.map((r) => r.id));
  const data: ClientData = {
    Me: me ? strip(me) : null,
    Requests: requests,
    Files: (t.Files ?? []).filter((f) => f.client_id === s.uid),
    StatusHistory: (t.StatusHistory ?? []).filter((h) => ids.has(h.request_id)),
    Documents: (t.Documents ?? []).filter((d) => d.client_id === s.uid && d.visible_to_client === "yes"),
  };
  const tickets = sign([...data.Files.map((f) => f.drive_file_id), ...data.Documents.map((d) => d.drive_file_id)]);
  return { unchanged: false, version: snap.version, data, tickets, ticketsAt: Date.now(), url: process.env.APPS_SCRIPT_URL! };
}
