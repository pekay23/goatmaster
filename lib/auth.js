import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing. Authentication cannot initialize.');
}
const SECRET = new TextEncoder().encode(JWT_SECRET);
const COOKIE = 'gm_token';
const EXPIRES = '7d';

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES)
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// Read the current user from the JWT cookie (server-side)
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Set the JWT cookie on a response
export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}

// Clear the auth cookie
export function clearAuthCookie(response) {
  response.cookies.set(COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}

// Middleware helper — returns the user or a 401 response
export async function requireAuth(request) {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return { user: null, error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) };
  const user = await verifyToken(token);
  if (!user) return { user: null, error: NextResponse.json({ error: 'Session expired' }, { status: 401 }) };
  return { user, error: null };
}
