import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/options';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-normalize';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';

const RL_LIMIT = 30;
const RL_WINDOW = 10 * 60 * 1000; // 10 min

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const metaBase = requestMeta(request);
  const rl = rateLimit(`complete-profile:${clientIp(request)}`, RL_LIMIT, RL_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(fail('unauthorized', 'No autorizado', undefined, metaBase), {
        status: 401,
        headers: rateLimitHeaders(rl),
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { professional: true },
    });

    if (!user) {
      return NextResponse.json(fail('not_found', 'Usuario no encontrado', undefined, metaBase), {
        status: 404,
        headers: rateLimitHeaders(rl),
      });
    }

    if (user.professional) {
      return NextResponse.json(fail('conflict', 'Ya tienes un perfil profesional', undefined, metaBase), {
        status: 400,
        headers: rateLimitHeaders(rl),
      });
    }

    const body = await request.json();
    const { phone, location, bio, experienceYears, professionalGroup, serviceLocations, services } = body;

    if (!phone || !location || !bio || !professionalGroup) {
      return NextResponse.json(fail('validation_error', 'Faltan campos requeridos', undefined, metaBase), {
        status: 400,
        headers: rateLimitHeaders(rl),
      });
    }

    if (!services || services.length === 0) {
      return NextResponse.json(fail('validation_error', 'Debes agregar al menos un servicio', undefined, metaBase), {
        status: 400,
        headers: rateLimitHeaders(rl),
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const categoryGroupRecord = await tx.categoryGroup.upsert({
        where: { id: professionalGroup },
        update: {},
        create: {
          id: professionalGroup,
          name: professionalGroup === 'oficios' ? 'Oficios' : 'Profesiones',
          slug: professionalGroup,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          phone,
          location,
          role: 'professional',
        },
      });

      const professional = await tx.professional.create({
        data: {
          userId: user.id,
          bio,
          experienceYears: experienceYears || 0,
          professionalGroup,
          location,
          serviceLocations: serviceLocations || [location],
          whatsapp: normalizeWhatsAppNumber(phone) || null,
          status: 'pending',
          verified: false,
        },
      });

      for (const service of services) {
        const category = await tx.category.findUnique({
          where: { slug: service.categoryId },
        });

        if (category) {
          await tx.service.create({
            data: {
              professionalId: professional.id,
              categoryId: category.id,
              categoryGroup: professionalGroup,
              title: service.title || category.name,
              description: service.description,
              available: true,
            },
          });
        } else {
          const fallbackName = String(service.categoryId)
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (m: string) => m.toUpperCase());

          const newCategory = await tx.category.create({
            data: {
              name: fallbackName,
              description: '',
              slug: service.categoryId,
              active: true,
              groupId: categoryGroupRecord.id,
            },
          });

          await tx.service.create({
            data: {
              professionalId: professional.id,
              categoryId: newCategory.id,
              categoryGroup: professionalGroup,
              title: service.title || newCategory.name,
              description: service.description,
              available: true,
            },
          });
        }
      }

      return professional;
    });

    return NextResponse.json(ok(result, metaBase), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('Error en complete-profile v1:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const isValidation =
      message.toLowerCase().includes('required') ||
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('not found');

    return NextResponse.json(
      fail(isValidation ? 'validation_error' : 'server_error', message, undefined, metaBase),
      { status: isValidation ? 400 : 500, headers: rateLimitHeaders(rl) }
    );
  }
}
