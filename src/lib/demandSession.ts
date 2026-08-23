import { cookies } from "next/headers";

const COOKIE_NAME = "demand_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Anonim, azonosítható-de-nem-személyes session ID az ingatlan-kereső
 * AI Gateway hívásaihoz (per-user rate limit tag). Nem hitelesítés — csak
 * költség- és visszaélés-védelmi célt szolgál.
 */
export async function getOrCreateDemandSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return id;
}
