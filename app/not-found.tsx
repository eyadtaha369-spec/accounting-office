import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
      <div>
        <div className="text-6xl font-bold text-navy-900">404</div>
        <p className="mt-3 text-slate-600">الصفحة غير موجودة — Page not found</p>
        <Link href="/" className="btn-navy mt-6">الرئيسية / Home</Link>
      </div>
    </div>
  );
}
