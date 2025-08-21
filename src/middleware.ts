import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Generate a simple request ID for Edge Runtime compatibility
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function middleware(request: NextRequest) {
  const reqId = generateRequestId();
  
  // Set request ID header for logging
  const response = NextResponse.next();
  response.headers.set('x-request-id', reqId);
  
  // Log request (Edge Runtime compatible)
  console.log(JSON.stringify({
    level: 'info',
    ts: new Date().toISOString(),
    scope: 'middleware',
    msg: `${request.method} ${request.nextUrl.pathname}`,
    reqId,
    userAgent: request.headers.get('user-agent')?.substring(0, 100),
  }));

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/specimen',
    '/metrics',
    '/leaderboards',
    '/map',
    '/friends',
    '/notifications',
    '/settings',
    '/my-specimen',
    '/profile',
  ];

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedRoute) {
    try {
      // Check for JWT token in cookies
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (!token) {
        // Redirect to login with callback URL
        const callbackUrl = encodeURIComponent(request.url);
        const loginUrl = new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url);
        
        console.log(JSON.stringify({
          level: 'warn',
          ts: new Date().toISOString(),
          scope: 'middleware',
          msg: 'Unauthorized access attempt',
          reqId,
          pathname,
          redirectTo: loginUrl.toString(),
        }));
        
        return NextResponse.redirect(loginUrl);
      }
      
      // Log successful auth
      console.log(JSON.stringify({
        level: 'info',
        ts: new Date().toISOString(),
        scope: 'middleware',
        msg: 'Authorized access',
        reqId,
        pathname,
        userId: token.sub,
      }));
      
    } catch (error) {
      // If JWT check fails, redirect to login
      console.log(JSON.stringify({
        level: 'error',
        ts: new Date().toISOString(),
        scope: 'middleware',
        msg: 'JWT check failed',
        reqId,
        pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      
      const callbackUrl = encodeURIComponent(request.url);
      const loginUrl = new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 