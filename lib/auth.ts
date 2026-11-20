import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession, type Session } from "./session";
import { getUser } from "./db";

export const getSession = cache(readSession);

/** أي مستخدم مسجّل */
export async function requireLogin(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

/** فريق المكتب (admin أو staff) */
export async function requireStaff(): Promise<Session> {
  const s = await requireLogin();
  if (s.role === "client") redirect("/dashboard");
  return s;
}

/** الأدمن فقط — يُعاد التحقق من الدور من الشيت للعمليات الحساسة */
export async function requireAdmin(): Promise<Session> {
  const s = await requireStaff();
  const u = await getUser(s.uid);
  if (!u || u.role !== "admin") throw new Error("forbidden");
  return s;
}
