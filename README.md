# موقع مكتب المحاسبة القانونية — دليل التشغيل

**التقنيات:** Next.js 15 · React 19 · Tailwind CSS 4 · **Google Sheets** (قاعدة البيانات) · **Google Drive** (الملفات وصور البطاقات) · **Apps Script** (الـ API)

## كيف يعمل
```
المتصفح ──► Next.js (Vercel) ──[API_SECRET]──► Apps Script ──► Google Sheet
   │                                                  │
   └──[تذكرة موقّعة لمدة قصيرة]── رفع/تحميل الملفات ──► Google Drive (مجلد خاص)
```
- كل البيانات في Google Sheet واحد تملكه أنت (أوراق: Users, Requests, Files, StatusHistory, Notes, Credentials).
- الصلاحيات (العميل يرى بياناته فقط، الأدمن يرى الكل) تُطبَّق داخل خادم Next.js. Apps Script لا يستجيب إلا بالمفتاح السري.
- الملفات تُحفظ في مجلد Drive خاص، ولا تُفتح إلا بتذكرة موقّعة صالحة لمدة ساعة.

---

## خطوات التشغيل

### 1) إنشاء الشيت والـ API (10 دقائق)
1. افتح [sheets.new](https://sheets.new) وسمِّه مثلاً `Accounting Office DB`.
2. من القائمة: **Extensions ← Apps Script**.
3. احذف المحتوى الموجود، والصق محتوى الملف `apps-script/Code.gs` بالكامل، واضغط **Save** 💾.
4. من القائمة المنسدلة أعلى المحرر اختر الدالة **setup**، ثم اضغط **Run**.
   - ستطلب Google الصلاحيات: **Review permissions ← حسابك ← Advanced ← Go to (unsafe) ← Allow**. هذا طبيعي لأي سكريبت خاص بك.
5. افتح **Execution log** وانسخ القيمة بعد `API_SECRET =`.
6. اضغط **Deploy ← New deployment**، ثم من أيقونة الترس ⚙ اختر **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone ← (ضروري. الحماية بالمفتاح السري وليس بتسجيل دخول Google)
7. اضغط **Deploy** وانسخ **Web app URL** (ينتهي بـ `/exec`).

ارجع للشيت: ستجد الأوراق قد أُنشئت. وفي Google Drive ستجد مجلد `Accounting Office — Files (private)`.

### 2) إعداد المشروع على جهازك (PowerShell)
```powershell
copy .env.example .env.local
npm run gen:key     # ← SESSION_SECRET
npm run gen:key     # ← CREDENTIALS_ENCRYPTION_KEY (مفتاح مختلف)
notepad .env.local
```
املأ القيم الأربع:

| المتغير | القيمة |
|---|---|
| `APPS_SCRIPT_URL` | رابط الـ Web app من الخطوة 1 |
| `APPS_SCRIPT_SECRET` | الـ API_SECRET من Execution log |
| `SESSION_SECRET` | ناتج أول `gen:key` |
| `CREDENTIALS_ENCRYPTION_KEY` | ناتج ثاني `gen:key` |

### 3) التشغيل
```powershell
npm install
npm run dev
```
افتح `http://localhost:3000`.

### 4) تفعيل حساب الأدمن
1. سجّل حساباً من الموقع.
2. افتح الشيت ← ورقة **Users** ← في عمود `role` غيّر `client` إلى **`admin`**.
3. سجّل خروج ثم دخول، وستُوجَّه إلى لوحة الإدارة.

لموظف يدير الطلبات بدون رؤية كلمات مرور البوابات اكتب **`staff`** بدلاً من `admin`.

### 5) النشر على Vercel
1. ارفع المشروع على GitHub (ملف `.env.local` مستبعد تلقائياً).
2. في Vercel: **Add New Project** ← اختر المستودع.
3. أضف المتغيرات الأربعة في **Settings ← Environment Variables** ← **Deploy**.

---

## تعديل كود Apps Script لاحقاً
بعد أي تعديل على `Code.gs`: **Deploy ← Manage deployments ← ✏ ← Version: New version ← Deploy**، حتى يبقى الرابط كما هو.

## الأمان
| البيانات | الحماية |
|---|---|
| كلمات مرور العملاء | مشفّرة بـ scrypt ولا يمكن استرجاعها حتى من الشيت |
| بيانات دخول البوابات الضريبية | مشفّرة AES-256-GCM، والمفتاح في Vercel فقط وليس في الشيت |
| صور البطاقة والمستندات | مجلد Drive خاص، وتُفتح بتذكرة موقّعة لمدة ساعة |
| الجلسة | Cookie موقّعة (httpOnly) لمدة 12 ساعة |

- **الشيت نفسه يحتوي بيانات شخصية (الرقم القومي والهواتف).** لا تشاركه مع أحد، وفعّل التحقق بخطوتين على حساب Google.
- احتفظ بنسخة آمنة من `CREDENTIALS_ENCRYPTION_KEY`. لو ضاع لن يمكن فك تشفير بيانات البوابات.
- تغيير الدور (admin/client) في الشيت يُطبَّق عند تسجيل الدخول التالي. صلاحية كشف بيانات البوابات يُعاد التحقق منها من الشيت في كل مرة.

## الفروق عن نسخة Supabase
- **لا يوجد تفعيل بالبريد الإلكتروني.** العميل يدخل مباشرة بعد التسجيل.
- **التحديث شبه لحظي:** صفحات المتابعة تتحدث تلقائياً كل 30–45 ثانية، وفور الرجوع للصفحة.
- **حد حجم الملف 10 ميجابايت.**
- **الأداء:** كل صفحة تستغرق حوالي 1–2 ثانية (سرعة Apps Script). مناسب لمكتب حتى بضعة آلاف من الطلبات.
- **الحصص اليومية لـ Apps Script** (الحساب المجاني): حوالي 20,000 طلب يومياً، وهي أكثر من كافية لمكتب محاسبة.

## تخصيص سريع
- **اسم المكتب والعنوان والهاتف والمواعيد:** `lib/i18n.ts`
- **الألوان:** `app/globals.css` (قسم `@theme`)
