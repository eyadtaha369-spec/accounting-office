import AuthShell from "@/components/AuthShell";
import RegisterForm from "./RegisterForm";
import { getDict } from "@/lib/locale";

export default async function RegisterPage() {
  const { t, locale } = await getDict();
  return (
    <AuthShell t={t} locale={locale} wide>
      <RegisterForm t={t} />
    </AuthShell>
  );
}
