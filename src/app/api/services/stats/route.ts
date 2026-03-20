import { NextResponse } from 'next/server';
import { getServiceCounts } from '@/lib/server/services';

export async function GET() {
  try {
    const countsBySlug = await getServiceCounts();
    return NextResponse.json(
      { success: true, data: countsBySlug },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('GET /api/services/stats error:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
