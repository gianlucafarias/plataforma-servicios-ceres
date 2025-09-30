import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const professional = await prisma.professional.findUnique({
      where: { id },
      select: {
        id: true,
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
        CV: true,
        ProfilePicture: true,
        location: true,
        serviceLocations: true,
        schedule: true,
        user: { select: { firstName: true, lastName: true, email: true, phone: true, verified: true } },
        services: {
          orderBy: { createdAt: 'asc' },
          include: {
            category: { select: { name: true, slug: true } }
          }
        },
      },
    });
  
    if (!professional) {
      return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
    }
  
    return NextResponse.json({ success: true, data: professional });
  }
