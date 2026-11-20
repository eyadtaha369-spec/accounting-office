"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { cleanClient, type ClientFields } from "@/lib/client-input";
import { createSession, destroySession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { batch, insert, type Row } from "@/lib/sheets";
import { getUserRowByEmail } from "@/lib/db";
import { readTicket, uploadTicket, verifyReceipt, type UploadTicket } from "@/lib/tickets";
import type { Uploaded } from "@/lib/direct";

export async function setLocale(locale: "ar" | "en") {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

export async function login(email: string, password: string, next?: string) {
  const u = await getUserRowByEmail(String(email).trim());
  if (!u || !verifyPassword(String(password), u.password_hash)) return { error: "invalid" as const };
  const role = (u.role || "client") as "client" | "staff" | "admin";
  await createSession(u.id, role, u.full_name);
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (role === "client") return { redirect: safe && !safe.startsWith("/admin") ? safe : "/dashboard" };
  return { redirect: safe?.startsWith("/admin") ? safe : "/admin" };
}

/** تذكرة لرفع صورتي البطاقة أثناء التسجيل (صالحة 15 دقيقة) */
export async function getRegisterTicket() {
  const prefix = `pending-${crypto.randomUUID()}`;
  return { url: process.env.APPS_SCRIPT_URL!, ticket: uploadTicket({ folder: "ids", prefix, uid: "pending" }) };
}

export type RegisterInput = ClientFields & { consent: boolean };

export async function register(input: RegisterInput, ticket: string, front: Uploaded, back: Uploaded) {
  if (!input.consent) return { error: "consent", field: "consent" };
  const { d, error } = cleanClient(input);
  if (error) return error;

  const t = readTicket<UploadTicket>(ticket);
  if (!t || t.folder !== "ids" || !verifyReceipt(ticket, front?.fileId, front?.receipt) || !verifyReceipt(ticket, back?.fileId, back?.receipt) || front.fileId === back.fileId) {
    return { error: "idImages", field: "id_front" };
  }

  const [byEmail, byId] = (await batch([
    { op: "select", table: "Users", where: { email: d.email } },
    { op: "select", table: "Users", where: { national_id: d.national_id } },
  ])) as [Row[], Row[]];
  if (byEmail.length) return { error: "duplicateEmail", field: "email" };
  if (byId.length) return { error: "duplicateId", field: "national_id" };

  const { password, ...rest } = d;
  const user = await insert("Users", {
    ...rest,
    role: "client",
    password_hash: hashPassword(password),
    id_front_file: front.fileId,
    id_back_file: back.fileId,
  });
  await createSession(user.id, "client", user.full_name);
  return { ok: true };
}
