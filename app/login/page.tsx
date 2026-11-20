import AuthShell from "@/components/AuthShell";
import LoginForm from "./LoginForm";
import { getDict } from "@/lib/locale";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { t, locale } = await getDict();
  const sp = await searchParams;
  return (
    <AuthShell t={t} locale={locale}>
      <LoginForm t={t} next={sp.next} />
    </AuthShell>
  );
}
