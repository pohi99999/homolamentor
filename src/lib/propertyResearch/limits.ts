// Abuse and cost protection of the property search (card f1798734, content 75acc820 ch. 2.4).
// While testing, the search runs on the free Gemini tier: the "cost cap" is a request-count cap,
// sized under the free quota so a bot cannot use up the day's quota for real visitors.
//
// State lives in memory: good enough for the test phase on one Fluid compute instance, NOT for
// production (several instances each keep their own counters). Production needs a shared store
// (Upstash Redis free tier or a Supabase table), proposed on the card.

export type Clock = () => number;

/** Sliding-window limiter: at most `max` hits per `windowMs` per key. */
export class WindowLimiter {
  private hits = new Map<string, number[]>();
  private max: number;
  private windowMs: number;
  private now: Clock;
  constructor(max: number, windowMs: number, now: Clock = Date.now) {
    this.max = max;
    this.windowMs = windowMs;
    this.now = now;
  }

  /** Records a hit if allowed; returns the seconds to wait when it is not. */
  take(key: string): { ok: true } | { ok: false; retryAfter: number } {
    const t = this.now();
    const recent = (this.hits.get(key) ?? []).filter((h) => t - h < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + this.windowMs - t) / 1000)) };
    }
    recent.push(t);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(t);
    return { ok: true };
  }

  private prune(t: number) {
    for (const [k, v] of this.hits) if (!v.some((h) => t - h < this.windowMs)) this.hits.delete(k);
  }
}

/** Calendar day in Budapest, e.g. "2026-10-04": the daily cap resets at local midnight. */
export function budapestDay(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms);
}

/** Daily cap on model calls across all visitors (the free-tier "cost gate"). */
export class DailyCap {
  private day = '';
  private used = 0;
  private cap: number;
  private now: Clock;
  constructor(cap: number, now: Clock = Date.now) {
    this.cap = cap;
    this.now = now;
  }

  take(): boolean {
    const d = budapestDay(this.now());
    if (d !== this.day) {
      this.day = d;
      this.used = 0;
    }
    if (this.used >= this.cap) return false;
    this.used += 1;
    return true;
  }

  remaining(): number {
    return budapestDay(this.now()) === this.day ? Math.max(0, this.cap - this.used) : this.cap;
  }
}

export const MIN_FILL_MS = 2500; // a human needs longer than this to fill in the "Érdekel" form

/** Honeypot filled or the form sent too fast: answer like a success, do nothing. */
export function looksLikeBot(website: unknown, startedAt: unknown, now: number): boolean {
  const honeypot = typeof website === 'string' && website.trim() !== '';
  const t = typeof startedAt === 'number' ? startedAt : 0;
  return honeypot || !t || now - t < MIN_FILL_MS;
}

export function envInt(raw: string | undefined, fallback: number, min = 0): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n >= min ? n : fallback;
}
