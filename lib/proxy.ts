// lib/proxy.ts
//
// Convention: `proxy.ts` files contain reusable auth guards for route
// protection. This file exports `requireAdmin`, which verifies the `jwt`
// cookie and enforces `role === 'admin'`. It can be used directly in
// Next.js middleware, Server Actions, or API route handlers.

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
const key = new TextEncoder().encode(JWT_SECRET);

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
}

/**
 * Verify a JWT token and return its payload, or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Require admin access. Returns `{ allowed, user }` where `allowed` is true
 * only when a valid `jwt` cookie is present and the user's role is `admin`.
 *
 * Usage in middleware:
 *   const { allowed, user } = await requireAdmin(request);
 *   if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 401 });
 *
 * Usage in an API route handler:
 *   const { allowed, user } = await requireAdmin(request);
 *   if (!allowed) return NextResponse.json({ error: 'Admin required' }, { status: 403 });
 */
export async function requireAdmin(request: NextRequest): Promise<{
  allowed: boolean;
  user: AuthPayload | null;
}> {
  const token = request.cookies.get('jwt')?.value;
  if (!token) {
    return { allowed: false, user: null };
  }

  const user = await verifyToken(token);
  if (!user || user.role !== 'admin') {
    return { allowed: false, user: null };
  }

  return { allowed: true, user };
}

/**
 * Build the appropriate denial response for an admin-protected path.
 * API paths get a JSON 401; page paths get a redirect to /login.
 */
export function adminDenied(pathname: string, requestUrl: URL): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', requestUrl));
}
