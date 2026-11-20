import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = String(stored).split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const a = scryptSync(pw, salt, 64);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
