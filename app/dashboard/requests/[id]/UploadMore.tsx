"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkFiles } from "@/lib/format";
import { uploadDirect } from "@/lib/direct";
import { getRequestUploadTicket, registerUploads, resubmitRequest } from "@/app/file-actions";
import type { Dict } from "@/lib/i18n";

export default function UploadMore({ t, requestId }: { t: Dict; requestId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setError("");
    if (!files.length) return setError(t.auth.errors.required);
    if (!checkFiles(files)) return setError(t.dash.fileTypeDocs);
    setLoading(true);
    try {
      const tk = await getRequestUploadTicket(requestId);
      const uploaded = await Promise.all(files.map((f) => uploadDirect(tk, f)));
      await registerUploads(tk.ticket, uploaded);
      await resubmitRequest(requestId);
      setFiles([]);
      router.refresh();
    } catch {
      setError(t.auth.errors.generic);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        multiple
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-800"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={go} disabled={loading} className="btn-gold">
        {loading ? t.auth.submitting : t.dash.uploadAndResubmit}
      </button>
    </div>
  );
}
