/**
 * Az admin felülethez és az admin API végpontokhoz engedélyezett fiókok.
 *
 * Szándékosan függőségmentes modul: a `proxy.ts` (edge runtime) és a
 * szerveroldali route handlerek is ezt használják, így a lista egyetlen
 * helyen él, nem duplikálódik.
 */
export const ALLOWED_EMAILS = [
  "peterpohankapersonal@gmail.com",
  "office.homlamentor@gmail.com",
];

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
