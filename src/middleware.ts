import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, BACKADMIN_COOKIE } from '@/lib/backadmin';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all /test routes (UI)
  if (pathname.startsWith('/test') && pathname !== '/test/layout') {
    const token = request.cookies.get(BACKADMIN_COOKIE)?.value;

    if (!token || !verifySessionToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect all /api/test routes (API)
  if (pathname.startsWith('/api/test')) {
    const token = request.cookies.get(BACKADMIN_COOKIE)?.value;

    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized - admin authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/test/:path*', '/api/test/:path*'],
};
