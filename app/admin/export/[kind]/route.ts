import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { batch, type Row } from "@/lib/sheets";
import { getDict } from "@/lib/locale";
import { clientOptions } from "@/lib/ops";
import { requestLabel } from "@/lib/labels";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // حماية من حقن الصيغ في Excel + تهريب الفواصل وعلامات الاقتباس
  const safe = /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const s = await getSession();
  if (!s || s.role === "client") return new NextResponse("Forbidden", { status: 403 });
  const { kind } = await params;
  if (kind === "finance" && s.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const { t } = await getDict();
  const o = t.ops;
  const service = new URL(req.url).searchParams.get("service") ?? "";

  const tableMap: Record<string, "Users" | "Requests" | "ServiceRecords" | "Tasks" | "Finance"> = {
    clients: "Users", requests: "Requests", records: "ServiceRecords", tasks: "Tasks", finance: "Finance",
  };
  const table = tableMap[kind];
  if (!table) return new NextResponse("Not found", { status: 404 });

  const [rows, users] = (await batch([
    { op: "select", table, where: table === "Users" ? { role: "client" } : {} },
    { op: "select", table: "Users", where: { role: "client" } },
  ])) as [Row[], Row[]];
  const names = new Map(clientOptions(users).map((c) => [c.id, c.name]));
  const L = <T extends Record<string, string>>(m: T, k: string) => (m as Record<string, string>)[k] ?? k;

  let head: string[] = [];
  let body: unknown[][] = [];
  const by = (a: Row, b: Row) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));

  if (kind === "clients") {
    head = [t.auth.fullName, t.auth.phone, t.auth.phoneAlt, t.auth.email, t.auth.nationalId, t.auth.taxNumber, t.auth.clientType, t.auth.companyName, t.auth.taxOffice, t.auth.address, o.fileStatus, t.dash.date];
    body = rows.sort(by).map((r) => [r.full_name, r.phone, r.phone_alt, r.email, r.national_id, r.tax_registration_number, L(t.clientTypes, r.client_type), r.company_name, r.tax_office, r.address, L(t.fileStatus, r.file_status || "active"), r.created_at?.slice(0, 10)]);
  } else if (kind === "requests") {
    head = [t.dash.refNo, o.client, t.dash.service, t.dash.notes, o.status, t.admin.messageToClient, t.dash.date, t.admin.completedAt];
    body = rows.sort(by).map((r) => [r.reference_no, names.get(r.client_id), requestLabel(t, r.request_type, r.sub_type), r.description, L(t.status, r.status), r.admin_message, r.created_at?.slice(0, 10), r.completed_at?.slice(0, 10)]);
  } else if (kind === "records") {
    head = [o.client, t.dash.service, o.period, o.dueDate, o.status, o.amount, o.reference, o.notes];
    body = rows.filter((r) => !service || r.service === service).sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
      .map((r) => {
        const today = new Date().toISOString().slice(0, 10);
        const st = r.status !== "filed" && r.due_date && r.due_date < today ? "late" : r.status;
        return [names.get(r.client_id), L(o.services, r.service), r.period, r.due_date, L(o.recordStatus, st), r.amount, r.reference, r.notes];
      });
  } else if (kind === "tasks") {
    head = [o.title, o.client, o.dueDate, o.priority, o.status, o.assignedTo, o.notes];
    body = rows.sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
      .map((r) => [r.title, names.get(r.client_id) ?? "", r.due_date, L(o.prio, r.priority), L(o.taskStatus, r.status), r.assigned_to, r.notes]);
  } else if (kind === "finance") {
    head = [o.date, o.type, o.category, o.amount, o.method, o.client, o.description];
    body = rows.sort((a, b) => b.date.localeCompare(a.date))
      .map((r) => [r.date, r.type === "income" ? o.income : o.expense, L(o.categories, r.category), r.type === "expense" ? `-${r.amount}` : r.amount, L(o.methods, r.method), names.get(r.client_id) ?? "", r.description]);
  }

  const csv = "﻿" + [head, ...body].map((r) => r.map(cell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}${service ? "-" + service : ""}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
