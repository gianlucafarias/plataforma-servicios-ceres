import { NextRequest, NextResponse } from 'next/server';
import { getServiceCountsByCategorySlug } from '@/lib/service-stats';

// Returns counts of available services grouped by category slug.
export async function GET(_request: NextRequest) {
  try {
    const countsBySlug = await getServiceCountsByCategorySlug();
    return NextResponse.json(
      { success: true, data: countsBySlug },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('GET /api/services/stats error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}

