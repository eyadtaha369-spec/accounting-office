import type { AdminData } from "@/lib/store-types";
import type { Dict } from "@/lib/i18n";
import { requestLabel } from "@/lib/labels";
import { clients, desc, downloadCsv, dueAsc, nameMap, todayStr } from "@/lib/view";

/** تصدير CSV من البيانات الموجودة في الذاكرة — فوري وبدون اتصال بالشيت */
export function exportCsv(kind: "clients" | "requests" | "records" | "tasks" | "finance", d: AdminData, t: Dict, service = "") {
  const o = t.ops;
  const names = nameMap(d.Users);
  const L = (m: Record<string, string>, k: string) => m[k] ?? k;
  const today = todayStr();
  if (kind === "clients") {
    downloadCsv("clients",
      [t.auth.fullName, t.auth.phone, t.auth.phoneAlt, t.auth.email, t.auth.nationalId, t.auth.taxNumber, t.auth.clientType, t.auth.companyName, t.auth.taxOffice, t.auth.address, o.fileStatus, t.dash.date],
      clients(d.Users).sort(desc()).map((r) => [r.full_name, r.phone, r.phone_alt, r.email, r.national_id, r.tax_registration_number, L(t.clientTypes, r.client_type), r.company_name, r.tax_office, r.address, L(t.fileStatus, r.file_status || "active"), r.created_at?.slice(0, 10)]));
  } else if (kind === "requests") {
    downloadCsv("requests",
      [t.dash.refNo, o.client, t.dash.service, t.dash.notes, o.status, t.admin.messageToClient, t.dash.date, t.admin.completedAt],
      [...d.Requests].sort(desc()).map((r) => [r.reference_no, names.get(r.client_id), requestLabel(t, r.request_type, r.sub_type), r.description, L(t.status, r.status), r.admin_message, r.created_at?.slice(0, 10), r.completed_at?.slice(0, 10)]));
  } else if (kind === "records") {
    downloadCsv(service ? `records-${service}` : "records",
      [o.client, t.dash.service, o.period, o.dueDate, o.status, o.amount, o.reference, o.notes],
      d.ServiceRecords.filter((r) => !service || r.service === service).sort(dueAsc).map((r) => {
        const st = r.status !== "filed" && r.due_date && r.due_date < today ? "late" : r.status;
        return [names.get(r.client_id), L(o.services, r.service), r.period, r.due_date, L(o.recordStatus, st), r.amount, r.reference, r.notes];
      }));
  } else if (kind === "tasks") {
    downloadCsv("tasks",
      [o.title, o.client, o.dueDate, o.priority, o.status, o.assignedTo, o.notes],
      [...d.Tasks].sort(dueAsc).map((r) => [r.title, names.get(r.client_id) ?? "", r.due_date, L(o.prio, r.priority), L(o.taskStatus, r.status), r.assigned_to, r.notes]));
  } else if (kind === "finance") {
    downloadCsv("finance",
      [o.date, o.type, o.category, o.amount, o.method, o.client, o.description],
      [...d.Finance].sort(desc("date")).map((r) => [r.date, r.type === "income" ? o.income : o.expense, L(o.categories, r.category), r.type === "expense" ? `-${r.amount}` : r.amount, L(o.methods, r.method), names.get(r.client_id) ?? "", r.description]));
  }
}
