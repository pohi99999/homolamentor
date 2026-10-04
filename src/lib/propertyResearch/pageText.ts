// Visible text of one public, non-portal source page, for the content check (card f1798734, ch. 2.5).
// One GET per card, size and time limited; portals on the denylist are never fetched.
import { isDeniedPortal } from './sourceCheck.ts';

const MAX_BYTES = 1_500_000;

export async function fetchPageText(url: string, timeoutMs = 5000): Promise<string | null> {
  if (isDeniedPortal(url)) return null;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'HomolaMentor-forrasellenorzes/1.0 (+https://homolamentor.vercel.app)' },
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!/text\/html|text\/plain|application\/xhtml/.test(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return null;
    return htmlToText(new TextDecoder('utf-8').decode(buf));
  } catch {
    return null;
  }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
