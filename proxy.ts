import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export default async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Determine application from hostname
  const isAdmin = hostname.startsWith('admin.');
  const isApp = hostname.startsWith('app.') || 
                (hostname === 'localhost:3000' && pathname.startsWith('/app'));
  const isMarketing = !isAdmin && !isApp;

  // Marketing: fully public
  if (isMarketing) {
    return NextResponse.next();
  }

  // Admin & App: require authentication
  const token = request.cookies.get('jwt')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('app', isAdmin ? 'admin' : 'app');
    return NextResponse.redirect(loginUrl);
  }

  // Admin-specific checks
  if (isAdmin) {
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // App-specific: verify org membership
  if (isApp) {
    const orgId = payload.orgId as string;
    if (!orgId) {
      return NextResponse.redirect(new URL('/no-organization', request.url));
    }
    
    // Check if user belongs to org
    const orgMatch = orgId === payload.orgId;
    if (!orgMatch && payload.role !== 'admin' && payload.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Attach org context to request headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.sub as string);
  response.headers.set('x-org-id', payload.orgId as string);
  response.headers.set('x-user-role', payload.role as string);
  response.headers.set('x-org-tier', payload.tier as string);
  response.headers.set('x-app', isAdmin ? 'admin' : 'app');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/app/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$).*)',
  ],
};