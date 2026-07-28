import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const ALLOWED_EMAILS = [
  "peterpohankapersonal@gmail.com",
  "office.homlamentor@gmail.com",
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.email && ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "homolamentor-secret-key-change-in-prod",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
