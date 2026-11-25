import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const secret = () => {
  const s = process.env.APPS_SCRIPT_SECRET;
  if (!s) throw new Error("APPS_SCRIPT_SECRET is not set");
  return s;
};
const hmac = (msg: string) => createHmac("sha256", secret()).update(msg, "utf8").digest("hex");

export type UploadTicket = {
  t: "up";
  folder: "ids" | "requests" | "docs";
  prefix: string;
  uid: string;          // صاحب التذكرة (أو "pending" أثناء التسجيل)
  requestId?: string;
  clientId?: string;
  kind?: "client_attachment" | "office_deliverable";
  exp: number;
  n: string;
};

/** تذكرة موقّعة يتحقق منها Apps Script — تسمح للمتصفح برفع/تحميل ملف محدد فقط */
export function signTicket(payload: object) {
  const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  return `${raw}.${hmac(raw)}`;
}

export function readTicket<T>(ticket: string): T | null {
  const [raw, sig] = String(ticket).split(".");
  if (!raw || !sig) return null;
  const expect = hmac(raw);
  if (expect.length !== sig.length || !timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  const payload = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload as T;
}

/** يتأكد أن Apps Script هو من أنشأ هذا الملف بهذه التذكرة */
export function verifyReceipt(ticket: string, fileId: string, receipt: string) {
  const raw = String(ticket).split(".")[0];
  const expect = hmac(`${fileId}|${raw}`);
  return expect.length === receipt?.length && timingSafeEqual(Buffer.from(expect), Buffer.from(receipt));
}

export function uploadTicket(p: Omit<UploadTicket, "t" | "exp" | "n">) {
  return signTicket({ ...p, t: "up", exp: Date.now() + 15 * 60_000, n: crypto.randomUUID() });
}

export function downloadTicket(fileId: string) {
  return signTicket({ t: "down", fileId, exp: Date.now() + 12 * 60 * 60_000 });
}
