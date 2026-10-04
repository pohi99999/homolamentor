// NEXTAUTH_SECRET is required: there is no built-in fallback any more (card f1798734). The old
// fallback was a string in a public repo, so a missing env var silently made every admin JWT
// forgeable. Called at module load, so a missing secret fails the build/startup, not a login.
export function nextAuthSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "NEXTAUTH_SECRET is missing or shorter than 16 characters: set it in the environment (Vercel: Production and Preview).",
    );
  }
  return s;
}
