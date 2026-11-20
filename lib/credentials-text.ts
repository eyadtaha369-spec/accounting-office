// يُستخدم في المتصفح
export function strongPassword(len = 12) {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%*?"];
  const all = sets.join("");
  const rnd = (n: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < len) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function welcomeText(template: string, v: { name: string; brand: string; url: string; email: string; password: string }) {
  return template
    .replace("{name}", v.name)
    .replace("{brand}", v.brand)
    .replace("{url}", v.url)
    .replace("{email}", v.email)
    .replace("{password}", v.password);
}

export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "20");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
