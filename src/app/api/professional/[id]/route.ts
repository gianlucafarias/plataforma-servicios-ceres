import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/options';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const professional = await prisma.professional.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      bio: true,
      experienceYears: true,
      verified: true,
      rating: true,
      reviewCount: true,
      specialties: true,
      professionalGroup: true,
      whatsapp: true,
      instagram: true,
      facebook: true,
      linkedin: true,
      website: true,
      portfolio: true,
      ProfilePicture: true,
      location: true,
      serviceLocations: true,
      hasPhysicalStore: true,
      physicalStoreAddress: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          verified: true,
          image: true,
          location: true,
        },
      },
      services: {
        where: { available: true },
        orderBy: { createdAt: 'asc' },
        include: {
          category: { select: { name: true, slug: true } },
        },
      },
      certifications: {
        where: { status: 'approved' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!professional) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
  }

  const isOwner = !!session?.user?.id && session.user.id === professional.userId;
  if (professional.status !== 'active' && !isOwner) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: professional });
}
