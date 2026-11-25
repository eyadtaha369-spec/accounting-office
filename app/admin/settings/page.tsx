import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import SiteSettingsView from "@/components/admin/site/SiteSettingsView";

export default async function Page() {
  const s = await requireStaff();
  if (s.role !== "admin") redirect("/admin");
  return <SiteSettingsView />;
}
