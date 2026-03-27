import { NextRequest, NextResponse } from 'next/server';
import { type User as PrismaUser, type Professional as PrismaProfessional } from '@prisma/client';
import type { CategoryGroup } from '@/types';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/utils';
import { enqueueEmailVerify } from '@/jobs/email.producer';
import { enqueueSlackAlert } from '@/jobs/slack.producer';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-normalize';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import {
  normalizeProfessionalDocumentationInput,
  upsertProfessionalDocumentation,
} from '@/lib/server/professional-documentation';

const RL_LIMIT = 40;
const RL_WINDOW = 10 * 60 * 1000; // 10 min

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

interface ServiceFormInput {
  categoryId: string;
  title: string;
  description: string;
}

interface RegisterRequestPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dni?: string; // Documento Nacional de Identidad (obligatorio)
  phone?: string;
  birthDate?: string;
  location?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  cv?: string;
  picture?: string;
  bio?: string;
  experienceYears?: number;
  professionalGroup?: CategoryGroup;
  serviceLocations?: string[];
  hasPhysicalStore?: boolean;
  physicalStoreAddress?: string;
  documentation?: unknown;
  services?: ServiceFormInput[];
}

export async function POST(request: NextRequest) {
  const metaBase = requestMeta(request);
  const rl = rateLimit(`auth-register:${clientIp(request)}`, RL_LIMIT, RL_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const payload: RegisterRequestPayload = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      dni,
      phone,
      birthDate,
      location,
      whatsapp,
      instagram,
      facebook,
      linkedin,
      website,
      portfolio,
      cv,
      picture,
      bio,
      experienceYears,
      professionalGroup,
      serviceLocations,
      hasPhysicalStore,
      physicalStoreAddress,
      documentation,
      services,
    } = payload;
    const documentationInput = normalizeProfessionalDocumentationInput(documentation);

    if (!email || !password || !firstName || !lastName || !dni) {
      return NextResponse.json(
        fail('validation_error', 'Faltan datos requeridos (email, contraseña, nombre, apellido y DNI son obligatorios)', undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    // Validar formato de DNI (7-8 dígitos)
    if (!/^\d{7,8}$/.test(dni.trim())) {
      return NextResponse.json(
        fail('validation_error', 'El DNI debe tener entre 7 y 8 dígitos', undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        fail('conflict', 'El usuario ya existe', undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const skipEmailVerification = process.env.DISABLE_EMAIL_VERIFICATION === 'true';

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          dni: dni.trim(),
          phone: phone || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          location: location || null,
          ...(skipEmailVerification ? { verified: true, emailVerifiedAt: new Date() } : {}),
        },
      });

      let professional: PrismaProfessional | null = null;

      if (bio || experienceYears || (services && services.length > 0) || professionalGroup) {
        const groupToUse = professionalGroup || 'oficios';

        const categoryGroupRecord = await tx.categoryGroup.upsert({
          where: { id: groupToUse },
          update: {},
          create: {
            id: groupToUse,
            name: groupToUse === 'oficios' ? 'Oficios' : 'Profesiones',
            slug: groupToUse,
          },
        });

        let servicesCreateData:
          | Array<{ categoryId: string; title: string; description: string; categoryGroup?: CategoryGroup }>
          | undefined = undefined;

        if (services && services.length > 0) {
          servicesCreateData = await Promise.all(
            services.map(async (s: ServiceFormInput) => {
              let category = await tx.category.findUnique({
                where: { slug: s.categoryId },
                select: { id: true },
              });
              if (!category) {
                const fallbackName = String(s.categoryId)
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (m: string) => m.toUpperCase());
                const created = await tx.category.create({
                  data: {
                    name: fallbackName,
                    description: '',
                    slug: s.categoryId,
                    active: true,
                    groupId: categoryGroupRecord.id,
                  },
                  select: { id: true },
                });
                category = created;
              }
              return {
                categoryId: category.id,
                title: s.title,
                description: s.description,
                categoryGroup: professionalGroup || undefined,
              };
            })
          );
        }

        professional = await tx.professional.create({
          data: {
            userId: user.id,
            bio: bio || '',
            experienceYears: typeof experienceYears === 'number' ? experienceYears : 0,
            requiresDocumentation: true,
            professionalGroup: professionalGroup || null,
            location: location || null,
            whatsapp: normalizeWhatsAppNumber(whatsapp) || null,
            instagram: instagram || null,
            facebook: facebook || null,
            linkedin: linkedin || null,
            website: website || null,
            portfolio: portfolio || null,
            CV: cv || null,
            ProfilePicture: picture || null,
            serviceLocations: serviceLocations || [],
            hasPhysicalStore: hasPhysicalStore || false,
            physicalStoreAddress: hasPhysicalStore ? physicalStoreAddress : null,
            services:
              servicesCreateData && servicesCreateData.length > 0
                ? {
                    create: servicesCreateData,
                  }
                : undefined,
          },
        });

        if (documentationInput.provided) {
          await upsertProfessionalDocumentation(tx, professional.id, documentationInput.documentation);
        }
      }

      let token: string | null = null;

      if (!skipEmailVerification) {
        token = generateRandomToken(48);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
        await tx.verificationToken.create({
          data: {
            userId: user.id,
            token,
            expiresAt,
          },
        });
      }

      return { user, professional, token };
    });

    const { password: _dbPassword, ...userWithoutPassword } = result.user as PrismaUser;
    void _dbPassword;

    if (!skipEmailVerification && result.token) {
      try {
        await enqueueEmailVerify({
          userId: userWithoutPassword.id,
          token: result.token,
          email: userWithoutPassword.email,
          firstName: userWithoutPassword.firstName || undefined,
        });
      } catch (e) {
        console.error('Error encolando correo de verificación (v1):', e);
        if (process.env.NODE_ENV !== 'production') {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
          const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
          const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(
            userWithoutPassword.email
          )}`;
          console.log('Verification URL (dev):', verifyUrl);
        }
      }
    } else if (skipEmailVerification) {
      console.log(`[register-v1] Email verification disabled – user ${userWithoutPassword.email} auto-verified`);
    }

    if (result.professional) {
      enqueueSlackAlert(
        `prof:new:${result.professional.id}`,
        `🔔 Nuevo profesional registrado (pendiente):\n*${userWithoutPassword.firstName} ${userWithoutPassword.lastName}*\nEmail: ${userWithoutPassword.email}\nGrupo: ${result.professional.professionalGroup || 'N/A'}\nServicios: ${payload.services?.length || 0}`
      ).catch((slackError) => console.error('Error enviando alerta a Slack:', slackError));
    }

    const devVerifyUrl =
      !skipEmailVerification && result.token && process.env.NODE_ENV !== 'production'
        ? (() => {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
            const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
            return `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(
              userWithoutPassword.email
            )}`;
          })()
        : undefined;

    return NextResponse.json(
      ok(
        {
          message: skipEmailVerification
            ? 'Usuario registrado exitosamente.'
            : 'Usuario registrado. Te enviamos un correo para confirmar la cuenta.',
          user: userWithoutPassword,
          professional: result.professional,
          ...(devVerifyUrl ? { devVerifyUrl } : {}),
        },
        metaBase
      ),
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error al registrar usuario (v1):', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const isValidation = message.toLowerCase().includes('categoría no encontrada') || message.toLowerCase().includes('faltan datos');
    return NextResponse.json(fail(isValidation ? 'validation_error' : 'server_error', message, undefined, metaBase), {
      status: isValidation ? 400 : 500,
      headers: rateLimitHeaders(rl),
    });
  }
}
