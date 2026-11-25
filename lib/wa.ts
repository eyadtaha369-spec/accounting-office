// رسائل واتساب جاهزة ومصاغة باحترافية
import { whatsappLink } from "./credentials-text";

export { whatsappLink };

export function statusMessage(o: { name: string; service: string; status: string; statusLabel: string; ref: string; url: string; brand: string; message?: string }) {
  const lines = [`السيد/ة ${o.name} المحترم/ة،`, `تحية طيبة من ${o.brand}.`, ""];
  if (o.status === "completed") {
    lines.push(`يسعدنا إبلاغكم بأنه تم الانتهاء من طلبكم: *${o.service}* (رقم ${o.ref}) ✅`);
    lines.push("يمكنكم الآن الدخول إلى حسابكم لتحميل المستند النهائي.");
  } else if (o.status === "needs_documents") {
    lines.push(`بخصوص طلبكم: *${o.service}* (رقم ${o.ref})، نحتاج إلى بعض المستندات الإضافية لاستكمال الإجراءات 📎`);
    if (o.message) lines.push(`المطلوب: ${o.message}`);
    lines.push("برجاء رفعها من خلال حسابكم على البوابة.");
  } else if (o.status === "in_progress") {
    lines.push(`نود إفادتكم بأن طلبكم: *${o.service}* (رقم ${o.ref}) أصبح الآن *جاري التنفيذ* ⏳`);
    lines.push("سنوافيكم بأي مستجدات أولاً بأول.");
  } else {
    lines.push(`تم تحديث حالة طلبكم: *${o.service}* (رقم ${o.ref}) إلى: *${o.statusLabel}*.`);
  }
  lines.push("", `للمتابعة: ${o.url}`, "", "مع خالص التحية،", o.brand);
  return lines.join("\n");
}

export function renewalMessage(o: { name: string; doc: string; date: string; expired: boolean; brand: string }) {
  return [
    `السيد/ة ${o.name} المحترم/ة،`,
    `تحية طيبة من ${o.brand}.`,
    "",
    o.expired
      ? `نود تنبيهكم إلى أن *${o.doc}* الخاص بكم قد انتهت صلاحيته بتاريخ ${o.date} ⚠️`
      : `نود تذكيركم بأن *${o.doc}* الخاص بكم تنتهي صلاحيته بتاريخ ${o.date} ⏰`,
    "يسعدنا تولي إجراءات التجديد نيابةً عنكم لتجنب أي غرامات أو تعطيل لنشاطكم.",
    "برجاء الرد على هذه الرسالة لبدء الإجراءات.",
    "",
    "مع خالص التحية،",
    o.brand,
  ].join("\n");
}
