import "server-only";
import { batch, type Row } from "./sheets";
import { toProfile } from "./db";

export type RecordRow = { id: string; client_id: string; service: string; period: string; due_date: string; status: string; amount: string; reference: string; notes: string; created_at: string };
export type TaskRow = { id: string; title: string; client_id: string; due_date: string; priority: string; status: string; assigned_to: string; notes: string; created_at: string };
export type FinanceRow = { id: string; type: "income" | "expense"; category: string; amount: string; date: string; client_id: string; description: string; method: string; created_at: string };
export type DocRow = { id: string; client_id: string; title: string; category: string; drive_file_id: string; file_name: string; mime_type: string; size_bytes: string; visible_to_client: string; uploaded_by: string; created_at: string };
export type ClientOption = { id: string; name: string };

/** قائمة العملاء المختصرة للقوائم المنسدلة + ربط الأسماء */
export function clientOptions(users: Row[]): ClientOption[] {
  return users
    .filter((u) => u.role === "client")
    .map((u) => ({ id: u.id, name: u.full_name + (u.company_name ? ` — ${u.company_name}` : "") }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export async function loadWithClients<T>(table: "ServiceRecords" | "Tasks" | "Finance" | "Documents", where: Record<string, string> = {}) {
  const [rows, users] = (await batch([
    { op: "select", table, where },
    { op: "select", table: "Users", where: { role: "client" } },
  ])) as [T[], Row[]];
  return { rows, clients: clientOptions(users), staff: [] as ClientOption[] };
}

export async function dashboardData() {
  const [users, requests, tasks, finance] = (await batch([
    { op: "select", table: "Users" },
    { op: "select", table: "Requests" },
    { op: "select", table: "Tasks", where: { status: "open" } },
    { op: "select", table: "Finance" },
  ])) as [Row[], Row[], TaskRow[], FinanceRow[]];
  const clients = users.filter((u) => u.role === "client").map(toProfile);
  return { clients, requests, tasks, finance };
}

export const num = (v: string) => {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const today = () => new Date().toISOString().slice(0, 10);

export function withNames<T extends { client_id: string }>(rows: T[], clients: ClientOption[]) {
  const m = new Map(clients.map((c) => [c.id, c.name]));
  return rows.map((r) => ({ ...r, clientName: m.get(r.client_id) ?? "" }));
}
