// أنواع البيانات المخزنة في المتصفح (لا تحتوي على كلمات مرور أو بيانات دخول البوابات)
export type R = Record<string, string>;

export type AdminData = {
  Users: R[];          // بدون password_hash
  Requests: R[];
  Files: R[];
  StatusHistory: R[];
  Notes: R[];
  ServiceRecords: R[];
  Tasks: R[];
  Finance: R[];        // فارغ لغير الأدمن
  Documents: R[];
  Portals: { client_id: string; portal: string }[]; // أي البوابات لها بيانات محفوظة فقط
};

export type ClientData = {
  Me: R | null;
  Requests: R[];
  Files: R[];
  StatusHistory: R[];
  Documents: R[];
};

export type Snapshot<T> = {
  version: string;
  data: T;
  tickets: Record<string, string>; // driveFileId -> تذكرة تحميل موقعة
  ticketsAt: number;
  url: string;
};

export type SnapshotResult<T> = { unchanged: true; version: string } | ({ unchanged: false } & Snapshot<T>);
