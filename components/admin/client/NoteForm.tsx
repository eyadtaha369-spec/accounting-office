"use client";
import { useState } from "react";
import { addInternalNote } from "@/app/admin/actions";
import { useAdmin } from "@/components/store/stores";
import { useI18n, useMe } from "@/components/store/I18n";
import { nowIso, replaceById, tmpId } from "@/lib/view";

export default function NoteForm({ clientId }: { clientId: string }) {
  const s = useAdmin();
  const me = useMe();
  const { t } = useI18n();
  const [body, setBody] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const text = body.trim();
        if (!text) return;
        setBody("");
        const id = tmpId();
        void s.mutate({
          apply: (d) => ({ ...d, Notes: [{ id, client_id: clientId, body: text, author_id: me.uid, author_name: me.name, created_at: nowIso() }, ...d.Notes] }),
          run: () => addInternalNote(clientId, text),
          commit: (d, r) => (r.ok ? { ...d, Notes: replaceById(d.Notes, id, r.note) } : d),
          error: t.sync.saveFailed,
        });
      }}
      className="flex gap-2"
    >
      <input value={body} onChange={(e) => setBody(e.target.value)} className="input" required maxLength={4000} />
      <button className="btn-navy shrink-0">{t.admin.addNote}</button>
    </form>
  );
}
