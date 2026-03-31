import { NextRequest } from 'next/server';
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
import { buildChanges, observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import {
  createEndUserActor,
  createRequestObservationContext,
} from '@/lib/observability/context';
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
  documentation?: unknown;
  services?: ServiceFormInput[];
}

function registrationAuditSnapshot(input: {
  user: Omit<PrismaUser, 'password'>;
  professional: PrismaProfessional | null;
  servicesCount: number;
  skipEmailVerification: boolean;
}) {
  return {
    userId: input.user.id,
    email: input.user.email,
    firstName: input.user.firstName,
    lastName: input.user.lastName,
    dni: input.user.dni,
    verified: input.user.verified,
    professionalId: input.professional?.id ?? null,
    professionalStatus: input.professional?.status ?? null,
    professionalGroup: input.professional?.professionalGroup ?? null,
    servicesCount: input.servicesCount,
    skipEmailVerification: input.skipEmailVerification,
  };
}

export async function POST(request: NextRequest) {
  const metaBase = requestMeta(request);
  const context = createRequestObservationContext(request, {
    route: '/api/v1/auth/register',
    requestId: metaBase.requestId,
  });
  const rl = rateLimit(`auth-register:${clientIp(request)}`, RL_LIMIT, RL_WINDOW);

  if (!rl.allowed) {
    return observedJson(
      context,
      fail('rate_limited', 'Demasiadas solicitudes. Intenta mas tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) },
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

    context.actor = createEndUserActor({
      email,
      label: [firstName, lastName].filter(Boolean).join(' ').trim() || email,
    });

    const documentationInput = normalizeProfessionalDocumentationInput(documentation);

    if (!email || !password || !firstName || !lastName || !dni) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.register',
        status: 'warning',
        summary: 'Intento de registro con datos incompletos',
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        metadata: {
          hasEmail: Boolean(email),
          hasFirstName: Boolean(firstName),
          hasLastName: Boolean(lastName),
          hasDni: Boolean(dni),
        },
      });

      return observedJson(
        context,
        fail(
          'validation_error',
          'Faltan datos requeridos (email, contrasena, nombre, apellido y DNI son obligatorios)',
          undefined,
          metaBase,
        ),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    if (!/^\d{7,8}$/.test(dni.trim())) {
      return observedJson(
        context,
        fail('validation_error', 'El DNI debe tener entre 7 y 8 digitos', undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.register',
        status: 'warning',
        summary: `Intento de registro con email ya existente: ${email}`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'user',
        entityId: existingUser.id,
      });

      return observedJson(
        context,
        fail('conflict', 'El usuario ya existe', undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const skipEmailVerification = process.env.DISABLE_EMAIL_VERIFICATION === 'true';
    const autoCreatedCategories: Array<{
      id: string;
      name: string;
      slug: string;
      groupId: string;
      parentCategoryId: string | null;
      active: boolean;
    }> = [];

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
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    groupId: true,
                    parentCategoryId: true,
                    active: true,
                  },
                });
                autoCreatedCategories.push(created);
                category = created;
              }
              return {
                categoryId: category.id,
                title: s.title,
                description: s.description,
                categoryGroup: professionalGroup || undefined,
              };
            }),
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

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.register',
      status: 'success',
      summary: `Usuario ${userWithoutPassword.id} registrado`,
      actor: {
        ...context.actor,
        id: userWithoutPassword.id,
      },
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'user',
      entityId: userWithoutPassword.id,
      changes: buildChanges(
        null,
        registrationAuditSnapshot({
          user: userWithoutPassword,
          professional: result.professional,
          servicesCount: payload.services?.length || 0,
          skipEmailVerification,
        }),
      ),
      metadata: {
        hasProfessional: Boolean(result.professional),
      },
    });

    for (const category of autoCreatedCategories.reduce<Array<typeof autoCreatedCategories[number]>>(
      (acc, current) => {
        if (acc.some((item) => item.slug === current.slug)) {
          return acc;
        }
        acc.push(current);
        return acc;
      },
      [],
    )) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'services.catalog',
        eventName: 'category.auto_created',
        status: 'success',
        summary: `Categoria ${category.slug} creada automaticamente durante registro`,
        actor: {
          ...context.actor,
          id: userWithoutPassword.id,
        },
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'category',
        entityId: category.id,
        changes: buildChanges(null, category),
        metadata: {
          source: 'auth_register',
          userId: userWithoutPassword.id,
        },
      });
    }

    try {
      await enqueueEmailVerify({
        userId: userWithoutPassword.id,
        token: result.token,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName || undefined,
        observability: {
          requestId: context.requestId,
          actor: {
            ...context.actor,
            id: userWithoutPassword.id,
          },
        },
      });
    } catch (e) {
      console.error('Error encolando correo de verificacion (v1):', e);
    }

    if (result.professional) {
      enqueueSlackAlert(
        `prof:new:${result.professional.id}`,
        `Nuevo profesional registrado (pendiente):\n*${userWithoutPassword.firstName} ${userWithoutPassword.lastName}*\nEmail: ${userWithoutPassword.email}\nGrupo: ${result.professional.professionalGroup || 'N/A'}\nServicios: ${payload.services?.length || 0}`,
      )
        .then(() =>
          safeRecordAuditEvent({
            kind: 'workflow',
            domain: 'auth',
            eventName: 'auth.register.slack_sent',
            status: 'success',
            summary: `Slack enviado por nuevo profesional ${result.professional?.id}`,
            actor: {
              ...context.actor,
              id: userWithoutPassword.id,
            },
            requestId: context.requestId,
            entityType: 'professional',
            entityId: result.professional?.id,
            metadata: {
              target: 'slack',
            },
          }),
        )
        .catch(async (slackError) => {
          console.error('Error enviando alerta a Slack:', slackError);
          await safeRecordAuditEvent({
            kind: 'workflow',
            domain: 'auth',
            eventName: 'auth.register.slack_failed',
            status: 'failure',
            summary: `Fallo la alerta Slack para profesional ${result.professional?.id}`,
            actor: {
              ...context.actor,
              id: userWithoutPassword.id,
            },
            requestId: context.requestId,
            entityType: 'professional',
            entityId: result.professional?.id,
            metadata: {
              target: 'slack',
              error: slackError instanceof Error ? slackError.message : 'Unknown error',
            },
          });
        });
    }

    const devVerifyUrl =
      !skipEmailVerification && result.token && process.env.NODE_ENV !== 'production'
        ? (() => {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
            const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
            return `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(
              userWithoutPassword.email,
            )}`;
          })()
        : undefined;

    return observedJson(
      context,
      ok(
        {
          message: skipEmailVerification
            ? 'Usuario registrado exitosamente.'
            : 'Usuario registrado. Te enviamos un correo para confirmar la cuenta.',
          user: userWithoutPassword,
          professional: result.professional,
          ...(devVerifyUrl ? { devVerifyUrl } : {}),
        },
        metaBase,
      ),
      { status: 201, headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    console.error('Error al registrar usuario (v1):', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const isValidation =
      message.toLowerCase().includes('categoria no encontrada') ||
      message.toLowerCase().includes('faltan datos');

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'auth',
      eventName: 'auth.register',
      status: isValidation ? 'warning' : 'failure',
      summary: 'Error durante el registro de usuario',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        error: message,
      },
    });

    return observedJson(
      context,
      fail(isValidation ? 'validation_error' : 'server_error', message, undefined, metaBase),
      {
        status: isValidation ? 400 : 500,
        headers: rateLimitHeaders(rl),
      },
    );
  }
}
