"use client";
import { useRef, useTransition } from "react";
import { addInternalNote } from "../../actions";

export default function NoteForm({ clientId, label }: { clientId: string; label: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const body = String(new FormData(e.currentTarget).get("body") ?? "");
        start(async () => {
          const r = await addInternalNote(clientId, body);
          if (r.ok) ref.current?.reset();
        });
      }}
      className="flex gap-2"
    >
      <input name="body" className="input" required maxLength={4000} />
      <button disabled={pending} className="btn-navy shrink-0">{label}</button>
    </form>
  );
}
