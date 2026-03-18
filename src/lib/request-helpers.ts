import type { NextRequest } from 'next/server';

export function clientIp(request: Request | NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}
