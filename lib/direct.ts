// يُستخدم في المتصفح: رفع/تحميل الملفات مباشرة من/إلى Google Drive عبر Apps Script بتذكرة موقّعة
export type Uploaded = { fileId: string; receipt: string; name: string; mimeType: string; size: number };
export type Ticket = { url: string; ticket: string };

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function post(url: string, body: object) {
  // text/plain = طلب بسيط بدون preflight (Apps Script لا يدعم OPTIONS)
  const res = await fetch(url, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "text/plain;charset=utf-8" } });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function uploadDirect(t: Ticket, file: File): Promise<Uploaded> {
  const data = await post(t.url, { action: "directUpload", ticket: t.ticket, name: file.name, mimeType: file.type, base64: await toBase64(file) });
  return { fileId: data.fileId, receipt: data.receipt, name: file.name, mimeType: file.type, size: file.size };
}

export async function downloadDirect(url: string, ticket: string): Promise<Blob> {
  const data = await post(url, { action: "directDownload", ticket });
  const bin = atob(data.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: data.mimeType });
}
