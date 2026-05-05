import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const callbackPath = `${pathname}${search || ''}`;
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', callbackPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  const requestId =
    request.headers.get('x-request-id') ||
    request.headers.get('x-cf-ray') ||
    crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
