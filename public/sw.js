/* Service Worker — مكتب محمد عبدالعال محمد
 * خفيف وآمن: لا يخزن صفحات الحسابات أو البيانات الخاصة، فقط الملفات الثابتة وصفحة عدم الاتصال.
 */
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // Server Actions والرفع لا تمر من هنا
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Google Apps Script / Drive / الخطوط مباشرة

  // ملفات Next الثابتة والأيقونات: من الكاش أولاً (أسماؤها تتغير مع كل إصدار)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // الصفحات: من الشبكة دائماً (بيانات حديثة وجلسات آمنة)، وصفحة "غير متصل" عند انقطاع الإنترنت
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
  }
});
