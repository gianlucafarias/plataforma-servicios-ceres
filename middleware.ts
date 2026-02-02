import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
  matcher: ['/api/:path*'],
};
