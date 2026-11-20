import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 12; // 12 ساعة

export type Session = { uid: string; role: "client" | "staff" | "admin"; name: string; exp: number };

const sign = (raw: string) => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return createHmac("sha256", s).update(raw).digest("base64url");
};

export async function createSession(uid: string, role: Session["role"], name: string) {
  const raw = Buffer.from(JSON.stringify({ uid, role, name, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${raw}.${sign(raw)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readSession(): Promise<Session | null> {
  const v = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!v) return null;
  const [raw, sig] = v.split(".");
  if (!raw || !sig) return null;
  const expect = sign(raw);
  if (expect.length !== sig.length || !timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  const s = JSON.parse(Buffer.from(raw, "base64url").toString()) as Session;
  return s.exp > Date.now() ? s : null;
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
