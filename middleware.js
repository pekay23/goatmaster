import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('gm_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/?unauthorized=1', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/?forbidden=1', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/?session_expired=1', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
