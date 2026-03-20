import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import {
  getProfessionalProfileContext,
  toProfessionalPublicApiProfile,
} from '@/lib/server/professional-profile';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const context = await getProfessionalProfileContext(id, session?.user?.id);
  if (!context.found) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: toProfessionalPublicApiProfile(context) });
}
