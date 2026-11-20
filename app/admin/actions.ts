"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { insert, select } from "@/lib/sheets";
import { batch } from "@/lib/sheets";
import { setRequestStatus, type Request } from "@/lib/db";
import { STATUSES, type Status } from "@/lib/i18n";

type Portal = "tax_portal" | "e_invoice";
const PORTALS: Portal[] = ["tax_portal", "e_invoice"];

export async function updateRequest(requestId: string, status: Status, message: string) {
  const s = await requireStaff();
  if (!STATUSES.includes(status)) return { ok: false };
  if (status === "needs_documents" && !message.trim()) return { ok: false };
  const [req] = (await select("Requests", { id: requestId })) as unknown as Request[];
  if (!req) return { ok: false };
  await setRequestStatus(req, status, message.trim().slice(0, 4000), s.uid, { assigned_to: s.uid });
  revalidatePath("/admin");
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true };
}

export async function saveCredentials(clientId: string, portal: Portal, username: string, password: string) {
  const s = await requireAdmin();
  if (!PORTALS.includes(portal)) return { ok: false };
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
  revalidatePath(`/admin/clients/${clientId}`);
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
  if (!body.trim()) return { ok: false };
  await insert("Notes", { client_id: clientId, body: body.trim().slice(0, 4000), author_id: s.uid, author_name: s.name });
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}
