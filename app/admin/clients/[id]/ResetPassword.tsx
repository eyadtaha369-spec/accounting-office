"use client";
import { useState, useTransition } from "react";
import { strongPassword } from "@/lib/credentials-text";
import { adminResetPassword } from "../../actions";
import CredentialsCard from "@/components/CredentialsCard";
import type { Dict } from "@/lib/i18n";

export default function ResetPassword({ t, clientId, name, phone, email }: { t: Dict; clientId: string; name: string; phone: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();

  if (done) return <CredentialsCard t={t} name={name} phone={phone} email={email} password={done} />;
  if (!open)
    return (
      <button onClick={() => { setOpen(true); setPw(strongPassword()); }} className="btn-outline">
        🔑 {t.admin.resetPassword}
      </button>
    );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={pw} onChange={(e) => setPw(e.target.value)} className="input font-mono" dir="ltr" />
        <button type="button" onClick={() => setPw(strongPassword())} className="btn-outline shrink-0 px-3" title={t.admin.generate}>↻</button>
      </div>
      {err && <p className="field-error">{t.auth.errors.password}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              setErr(false);
              const r = await adminResetPassword(clientId, pw);
              if (r.ok) setDone(pw);
              else setErr(true);
            })
          }
          className="btn-navy"
        >
          {pending ? t.common.loading : t.dash.save}
        </button>
        <button onClick={() => setOpen(false)} className="btn-outline">{t.common.cancel}</button>
      </div>
    </div>
  );
}
