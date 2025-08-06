import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow static files and public routes
    if (
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/api/auth') ||
      req.nextUrl.pathname.startsWith('/api/health') ||
      req.nextUrl.pathname.startsWith('/api/trpc') ||
      req.nextUrl.pathname === '/login' ||
      req.nextUrl.pathname === '/register' ||
      req.nextUrl.pathname === '/' ||
      req.nextUrl.pathname.startsWith('/public')
    ) {
      return NextResponse.next();
    }

    // Protect all other routes
    if (!req.nextauth.token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - api/health (health check)
     * - api/trpc (tRPC API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|api/health|api/trpc|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 