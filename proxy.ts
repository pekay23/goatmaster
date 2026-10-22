// proxy.ts
//
// Next.js middleware (16.x convention: `proxy` replaces `middleware`).
// Enforces admin-only access to:
//   - /admin/*        (admin portal pages)
//   - /api/admin/*    (admin API endpoints)
//
// Uses the `lib/proxy.ts` convention (`requireAdmin`) to verify the `jwt`
// cookie and enforce `role === 'admin'`.

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, adminDenied } from '@/lib/proxy';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin portal pages and admin API routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const { allowed, user } = await requireAdmin(request);

    if (!allowed) {
      return adminDenied(pathname, request.nextUrl);
    }

    // Forward lightweight identity headers to downstream API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', user?.sub ?? '');
    response.headers.set('x-user-role', user?.role ?? '');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
