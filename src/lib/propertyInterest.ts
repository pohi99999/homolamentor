// Validation of the "Érdekel" form, shared by the form (instant feedback) and the endpoint.
// Card f1798734. The messages are shown to visitors, in Hungarian.

export type InterestBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  consent?: unknown;
  marketing?: unknown;
  query?: unknown;
  website?: unknown; // honeypot: hidden from people, bots fill it in
  startedAt?: unknown;
};

export const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateInterest(body: InterestBody) {
  const errors: Record<string, string> = {};
  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  if (name.length < 2 || name.length > 120) errors.name = "Adja meg a nevét.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) errors.email = "Adjon meg egy érvényes e-mail címet.";
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[\d\s()/-]+$/.test(phone) || digits.length < 7 || digits.length > 15) errors.phone = "Adjon meg egy érvényes telefonszámot.";
  if (body.consent !== true) errors.consent = "A kapcsolatfelvételhez a hozzájárulása szükséges.";
  return errors;
}
