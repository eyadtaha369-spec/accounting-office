import { NextResponse, type NextRequest } from "next/server";

// فحص سريع لوجود الجلسة — التحقق الكامل من التوقيع والصلاحيات يتم داخل كل صفحة
export function middleware(request: NextRequest) {
  const has = Boolean(request.cookies.get("session")?.value);
  const path = request.nextUrl.pathname;
  if ((path.startsWith("/dashboard") || path.startsWith("/admin")) && !has) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
