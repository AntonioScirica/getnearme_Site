// URL di immagini che il server scarica o passa ai modelli (foto di annunci di qualsiasi sito):
// solo https pubblico. Blocca IP diretti, localhost e domini interni (niente SSRF banale).
// ponytail: non risolve il DNS (un dominio che punta a un IP privato passa); ok per immagini
// scaricate da OpenAI/R2, da rivedere se il server inizia a chiamare URL con dati sensibili.
export function isPublicHttpsUrl(u: unknown): u is string {
  if (typeof u !== 'string' || u.length > 2000) return false;
  let url: URL;
  try { url = new URL(u); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
  const h = url.hostname.toLowerCase();
  if (!h.includes('.') || h.startsWith('[') || /^\d+(\.\d+){3}$/.test(h)) return false;
  return !/(^|\.)(localhost|local|internal|intranet|lan|home|corp)$/.test(h);
}

// ponytail: controllo minimo, `npx tsx src/lib/safeUrl.ts`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('safeUrl.ts')) {
  const ok = ['https://photos.zillowstatic.com/fp/a.jpg', 'https://pwm.im-cdn.it/image/1/xxl.jpg'];
  const ko = ['http://x.com/a.jpg', 'https://127.0.0.1/a', 'https://localhost/a', 'https://[::1]/a', 'https://a.internal/x', 'https://u:p@x.com/a', 'https://x.com:8080/a'];
  console.assert(ok.every(isPublicHttpsUrl) && !ko.some(isPublicHttpsUrl), 'safeUrl');
  console.log('ok');
}

// Solo foto dei CDN dei portali o del nostro R2 (o https pubblici): il server non scarica URL arbitrari.
const ALLOWED = /^https:\/\/(?:pwm\.im-cdn\.it|img\d*\.idealista\.(?:it|com|pt)|images?-?\d*\.casa\.it)\//
export const allowedUrl = (u: string) => ALLOWED.test(u) || (!!process.env.R2_PUBLIC_URL && u.startsWith(`${process.env.R2_PUBLIC_URL}/`)) || isPublicHttpsUrl(u)
