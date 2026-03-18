import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 60;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rl = rateLimit(`professional-view:${id}:${clientIp(request)}`, LIMIT, WINDOW_MS);

  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'rate_limited' },
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

    return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('Error incrementando visitas de perfil:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
