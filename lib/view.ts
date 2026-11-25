// أدوات عرض وفلترة محلية (تعمل في المتصفح على البيانات المخزنة)
import type { R } from "./store-types";
import { normalizeDigits } from "./validation";

export const desc = (k = "created_at") => (a: R, b: R) => String(b[k] ?? "").localeCompare(String(a[k] ?? ""));
export const asc = (k = "created_at") => (a: R, b: R) => String(a[k] ?? "").localeCompare(String(b[k] ?? ""));
export const dueAsc = (a: R, b: R) => (a.due_date || "9999").localeCompare(b.due_date || "9999");

export const tmpId = () => `tmp-${crypto.randomUUID()}`;
export const isTmp = (id: string) => id.startsWith("tmp-");
export const nowIso = () => new Date().toISOString();
export const todayStr = () => new Date().toISOString().slice(0, 10);

export function clients(users: R[]) {
  return users.filter((u) => u.role === "client");
}

export function clientOptions(users: R[]) {
  return clients(users)
    .map((u) => ({ id: u.id, name: u.full_name + (u.company_name ? ` — ${u.company_name}` : "") }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export function nameMap(users: R[]) {
  return new Map(users.map((u) => [u.id, u.full_name] as const));
}

export function withNames<T extends R>(rows: T[], users: R[]) {
  const m = nameMap(users);
  return rows.map((r) => ({ ...r, clientName: m.get(r.client_id) ?? "" }));
}

/** بحث فوري بالاسم/الشركة/البريد أو بالأرقام (هاتف، رقم قومي، رقم ضريبي) */
export function searchClients(list: R[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return list;
  const digits = normalizeDigits(query);
  const isNum = /^[0-9]+$/.test(digits);
  return list.filter(
    (c) =>
      [c.full_name, c.company_name, c.email].some((v) => v?.toLowerCase().includes(query)) ||
      (isNum && [c.phone, c.phone_alt, c.national_id, c.tax_registration_number].some((v) => v?.includes(digits)))
  );
}

export const replaceById = (rows: R[], id: string, row: R) => rows.map((r) => (r.id === id ? row : r));
export const patchById = (rows: R[], id: string, patch: R) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
export const removeById = (rows: R[], id: string) => rows.filter((r) => r.id !== id);

/** ملف CSV يفتح في Excel بالعربية (UTF-8 BOM) مع حماية من حقن الصيغ */
export function downloadCsv(name: string, head: string[], body: unknown[][]) {
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    const safe = /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = "﻿" + [head, ...body].map((r) => r.map(cell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${todayStr()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
