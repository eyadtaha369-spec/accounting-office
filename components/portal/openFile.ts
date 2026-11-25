"use client";
import { downloadDirect } from "@/lib/direct";

/** يفتح ملفاً خاصاً من Drive في تبويب جديد (بتذكرة موقعة) */
export async function openDriveFile(url: string, ticket: string) {
  const win = window.open("", "_blank");
  try {
    const blob = await downloadDirect(url, ticket);
    const href = URL.createObjectURL(blob);
    if (win) win.location.href = href;
    else window.location.href = href;
  } catch {
    win?.close();
    alert("تعذّر فتح الملف / Could not open the file");
  }
}
