import { redirect } from "next/navigation";

// التسجيل الذاتي مغلق — الحسابات يُنشئها المكتب من لوحة الإدارة
export default function Page() {
  redirect("/login");
}
