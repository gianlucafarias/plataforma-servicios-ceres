import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 60;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const meta = requestMeta(request);
  const { id } = await params;
  const rl = rateLimit(`v1:professional-view:${id}:${clientIp(request)}`, LIMIT, WINDOW_MS);

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    await prisma.professional.update({
      where: { id },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(ok({ incremented: true }, meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    console.error('Error incrementando visitas de perfil (v1):', error);
    return NextResponse.json(
      fail('server_error', 'Error incrementando visitas de perfil', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
