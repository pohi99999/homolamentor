import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { isAllowedAdminEmail } from './lib/adminAccess';

const intlMiddleware = createMiddleware(routing);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass i18n for API routes.
  // FIGYELEM: ez a bypass a hitelesítést is átengedi, ezért az érzékeny
  // admin végpontok (/api/crm-sync, /api/gmail-history) saját maguk
  // ellenőrzik a session-t a `requireAdmin()` helperrel.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check if pathname matches /admin or /[locale]/admin
  const isAdminRoute =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    /^\/(hu|en|de|fr)\/admin(\/.*)?$/.test(pathname);

  if (isAdminRoute) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "homolamentor-secret-key-change-in-prod"
    });

    if (!token) {
      const signInUrl = new URL('/api/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(signInUrl);
    }

    if (token.email && !isAllowedAdminEmail(token.email)) {
      const signInUrl = new URL('/api/auth/signin', req.url);
      signInUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(signInUrl);
    }

    // Process locale redirection/routing for admin
    return intlMiddleware(req);
  }

  // For all other routes, run intlMiddleware
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};
