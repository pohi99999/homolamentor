import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const ALLOWED_EMAILS = [
  'peterpohankapersonal@gmail.com',
  'office.homlamentor@gmail.com'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET || "homolamentor-secret-key-change-in-prod" 
    });

    if (!token) {
      const signInUrl = new URL('/api/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(signInUrl);
    }

    if (token.email && !ALLOWED_EMAILS.includes(token.email.toLowerCase())) {
      const signInUrl = new URL('/api/auth/signin', req.url);
      signInUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/admin/:path*']
};
