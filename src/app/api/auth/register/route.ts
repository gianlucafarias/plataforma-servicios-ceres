import { NextRequest, NextResponse } from 'next/server';
import { type Professional as PrismaProfessional, type User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/utils';
import { enqueueEmailVerify } from '@/jobs/email.producer';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-normalize';
import {
  normalizeProfessionalDocumentationInput,
  ProfessionalDocumentationError,
  type ProfessionalDocumentationInput,
  upsertProfessionalDocumentation,
} from '@/lib/server/professional-documentation';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import type { CategoryGroup } from '@/types';

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

type ServiceFormInput = {
  categoryId: string;
  title: string;
  description: string;
};

type RegisterRequestPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dni?: string;
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
  documentation?: ProfessionalDocumentationInput | null;
  services?: ServiceFormInput[];
};

export async function POST(request: NextRequest) {
  const rl = rateLimit(`auth-register:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
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
    }: RegisterRequestPayload = await request.json();

    if (!email || !password || !firstName || !lastName || !dni) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (email, contrasena, nombre, apellido y DNI son obligatorios)' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (!/^\d{7,8}$/.test(dni.trim())) {
      return NextResponse.json(
        { error: 'El DNI debe tener entre 7 y 8 digitos' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const skipEmailVerification = process.env.DISABLE_EMAIL_VERIFICATION === 'true';
    const normalizedDocumentation = normalizeProfessionalDocumentationInput(documentation);

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
          | undefined;

        if (services && services.length > 0) {
          servicesCreateData = await Promise.all(
            services.map(async (service: ServiceFormInput) => {
              let category = await tx.category.findUnique({
                where: { slug: service.categoryId },
                select: { id: true },
              });

              if (!category) {
                const fallbackName = String(service.categoryId)
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (match: string) => match.toUpperCase());

                category = await tx.category.create({
                  data: {
                    name: fallbackName,
                    description: '',
                    slug: service.categoryId,
                    active: true,
                    groupId: categoryGroupRecord.id,
                  },
                  select: { id: true },
                });
              }

              return {
                categoryId: category.id,
                title: service.title,
                description: service.description,
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

        if (normalizedDocumentation.provided) {
          await upsertProfessionalDocumentation(
            tx,
            professional.id,
            normalizedDocumentation.documentation
          );
        }
      }

      let token: string | null = null;

      if (!skipEmailVerification) {
        token = generateRandomToken(48);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
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
      } catch (error) {
        console.error('Error encolando correo de verificacion:', error);
        if (process.env.NODE_ENV !== 'production') {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
          const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
          const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(userWithoutPassword.email)}`;
          console.log('Verification URL (dev):', verifyUrl);
        }
      }
    } else if (skipEmailVerification) {
      console.log(`[register] Email verification disabled – user ${userWithoutPassword.email} auto-verified`);
    }

    const devVerifyUrl =
      !skipEmailVerification && result.token && process.env.NODE_ENV !== 'production'
        ? (() => {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
            const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
            return `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(userWithoutPassword.email)}`;
          })()
        : undefined;

    return NextResponse.json(
      {
        message: skipEmailVerification
          ? 'Usuario registrado exitosamente.'
          : 'Usuario registrado. Te enviamos un correo para confirmar la cuenta.',
        user: userWithoutPassword,
        professional: result.professional,
        ...(devVerifyUrl ? { devVerifyUrl } : {}),
      },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';

    console.error('Error al registrar usuario:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack de registro:', error.stack);
    }

    const isValidation =
      error instanceof ProfessionalDocumentationError ||
      message.toLowerCase().includes('categoria no encontrada') ||
      message.toLowerCase().includes('faltan datos');

    return NextResponse.json(
      { error: message },
      { status: isValidation ? 400 : 500, headers: rateLimitHeaders(rl) }
    );
  }
}
