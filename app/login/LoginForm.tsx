"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions";
import type { Dict } from "@/lib/i18n";

export default function LoginForm({ t, next }: { t: Dict; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await login(String(fd.get("email")), String(fd.get("password")), next);
      if ("error" in res) {
        setError(t.auth.errors.invalidLogin);
        setLoading(false);
        return;
      }
      router.replace(res.redirect);
      router.refresh();
    } catch {
      setError(t.auth.errors.generic);
      setLoading(false);
    }
  }

  return (
    <div className="card border-t-4 border-t-gold-500 p-6 shadow-lg sm:p-8">
      <h1 className="text-2xl font-bold text-navy-900">{t.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.auth.loginSubtitle}</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">{t.auth.email}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t.auth.password}</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" dir="ltr" />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-navy w-full py-3">
          {loading ? t.common.loading : t.auth.loginBtn}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-semibold text-navy-700 hover:text-gold-600">{t.nav.register}</Link>
      </p>
    </div>
  );
}
