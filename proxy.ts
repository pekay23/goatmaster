import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminPermission, permissionForAdminPath } from '@/lib/admin-auth';
import { validateRecordInput } from '@/lib/input-validation';
import { verifyToken } from '@/lib/auth';
import { allowsMutationOrigin } from '@/lib/request-origin';

export default async function proxy(request: NextRequest) {
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (unsafe && request.nextUrl.pathname.startsWith('/api/') && request.nextUrl.pathname !== '/api/billing/webhook') {
    if (!allowsMutationOrigin(request.headers, request.nextUrl)) {
      return NextResponse.json({ error: 'Cross-origin request denied' }, { status: 403 });
    }
    if (request.headers.get('content-type')?.includes('application/json')) {
      const text = await request.clone().text();
      if (new TextEncoder().encode(text).length > 8 * 1024 * 1024) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
      try { const body: unknown = JSON.parse(text); if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new Error();
        const invalid = validateRecordInput(request.nextUrl.pathname, body);
        if (invalid) return NextResponse.json({ error: invalid }, { status: 400 }); }
      catch { return NextResponse.json({ error: 'A valid JSON object is required' }, { status: 400 }); }
    }
  }
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  if (pathname === '/admin-login') { const headers = new Headers(request.headers); for (const name of ['x-db-user-id', 'x-db-org-id', 'x-db-role']) headers.delete(name); return NextResponse.next({ request: { headers } }); }
  const isApi = pathname.startsWith('/api/');
  const isAdminLogin = pathname === '/api/admin/auth/login';
  const isPublicApi = new Set([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/admin/auth/login',
    '/api/admin/auth/logout',
    '/api/billing/webhook',
    '/api/public/tiers',
    '/api/jobs/reminders',
  ]).has(pathname);
  const isServiceApi = new Set([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/admin/auth/login',
    '/api/admin/auth/logout',
    '/api/billing/webhook',
  ]).has(pathname);

  // Determine application from hostname
  const isAdminApi = pathname.startsWith('/api/admin/') && !isAdminLogin;
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdmin = hostname.startsWith('admin.') || isAdminApi || isAdminPath;
  const tenantPages = ['/dashboard', '/herd', '/health', '/breeding', '/inventory', '/scan', '/settings', '/alerts', '/events', '/reports', '/sales', '/milk', '/weights', '/expenditures'];
  const isTenantPage = tenantPages.some(path => pathname === path || pathname.startsWith(`${path}/`));
  const isAppApi = isApi && !isAdminApi && !isPublicApi;
  const isApp = hostname.startsWith('app.') || pathname.startsWith('/api/app/') || isTenantPage || isAppApi;
  const isMarketing = !isAdmin && !isApp && !isPublicApi;

  // Public endpoints are authenticated by their own credentials or signature.
  if (isPublicApi) {
    const requestHeaders = new Headers(request.headers);
    for (const name of ['x-db-user-id', 'x-db-org-id', 'x-db-role']) requestHeaders.delete(name);
    if (isServiceApi) {
      requestHeaders.set('x-db-role', 'service');
      requestHeaders.set('x-db-user-id', '');
      requestHeaders.set('x-db-org-id', '');
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Marketing: fully public
  if (isMarketing) {
    const requestHeaders = new Headers(request.headers);
    for (const name of ['x-db-user-id', 'x-db-org-id', 'x-db-role']) requestHeaders.delete(name);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Admin & App: require authentication
  const token = request.cookies.get(isAdmin ? 'admin_jwt' : 'jwt')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const loginUrl = new URL(isAdmin ? '/admin-login' : '/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-specific checks
  if (isAdmin && !hasAdminPermission(payload, permissionForAdminPath(pathname, request.method))) {
    if (isApi) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (isAdmin && payload.type === 'impersonation') {
    if (isApi) return NextResponse.json({ error: 'Admin access is unavailable during impersonation' }, { status: 403 });
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // App-specific: verify org membership
  if (isApp) {
    const orgId = payload.orgId;
    if (!orgId) {
      if (isApi) return NextResponse.json({ error: 'Organization required' }, { status: 403 });
      return NextResponse.redirect(new URL('/no-organization', request.url));
    }
  }

  // Pass only verified claims to the route handler. App routes remain tenant scoped
  // even when an administrator is impersonating an organization.
  const requestHeaders = new Headers(request.headers);
  for (const name of ['x-db-user-id', 'x-db-org-id', 'x-db-role']) requestHeaders.delete(name);
  requestHeaders.set('x-db-user-id', String(payload.sub));
  requestHeaders.set('x-db-org-id', isApp ? String(payload.orgId) : '');
  requestHeaders.set('x-db-role', isAdmin ? payload.role === 'super_admin' ? 'super_admin' : 'admin' : 'user');
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin-login',
    '/app/:path*',
    '/dashboard/:path*',
    '/herd/:path*',
    '/health/:path*',
    '/breeding/:path*',
    '/inventory/:path*',
    '/scan/:path*',
    '/settings/:path*',
    '/alerts/:path*',
    '/events/:path*',
    '/reports/:path*',
    '/sales/:path*',
    '/milk/:path*',
    '/weights/:path*',
    '/expenditures/:path*',
    '/api/:path*',
  ],
};
