import { NextRequest } from 'next/server';
import { type User as PrismaUser, type Professional as PrismaProfessional } from '@prisma/client';
import type { CategoryGroup } from '@/types';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/utils';
import { enqueueEmailVerify } from '@/jobs/email.producer';
import { enqueueSlackAlert } from '@/jobs/slack.producer';
import { normalizeWhatsAppNumber, validateWhatsAppNumber } from '@/lib/whatsapp-normalize';
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
  gender?: string;
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
  experienceYears?: number | string | null;
  professionalGroup?: CategoryGroup;
  serviceLocations?: string[];
  hasPhysicalStore?: boolean;
  physicalStoreAddress?: string;
  documentation?: unknown;
  services?: ServiceFormInput[];
}

function isValidProfessionalGroup(value: unknown): value is CategoryGroup {
  return value === 'oficios' || value === 'profesiones';
}

function calculateAge(birthDate: Date, today = new Date()) {
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1
    : age;
}

function normalizeExperienceYears(value: RegisterRequestPayload['experienceYears']) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const years = Number(value);
  if (!Number.isFinite(years) || years < 0) {
    return null;
  }

  return years;
}

function validateRegistrationPayload(payload: RegisterRequestPayload) {
  const {
    email,
    password,
    firstName,
    lastName,
    dni,
    birthDate,
    location,
    whatsapp,
    bio,
    professionalGroup,
    serviceLocations,
    services,
    experienceYears,
  } = payload;

  if (!email || !password || !firstName || !lastName || !dni) {
    return 'Faltan datos requeridos (email, contrasena, nombre, apellido y DNI son obligatorios)';
  }

  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return 'Ingresa un email valido';
  }

  if (password.length < 6) {
    return 'La contrasena debe tener al menos 6 caracteres';
  }

  if (!/^\d{7,8}$/.test(dni.trim())) {
    return 'El DNI debe tener entre 7 y 8 digitos';
  }

  if (!birthDate) {
    return 'La fecha de nacimiento es requerida';
  }

  const parsedBirthDate = new Date(birthDate);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return 'La fecha de nacimiento es invalida';
  }

  if (calculateAge(parsedBirthDate) < 18) {
    return 'Debes ser mayor de 18 anos para registrarte';
  }

  if (!location?.trim()) {
    return 'La localidad es requerida';
  }

  if (!bio?.trim()) {
    return 'La descripcion profesional es requerida';
  }

  const normalizedExperienceYears = normalizeExperienceYears(experienceYears);
  if (normalizedExperienceYears === null) {
    return 'Los anos de experiencia deben ser un numero mayor o igual a 0';
  }

  if (!isValidProfessionalGroup(professionalGroup)) {
    return 'Debes elegir un grupo profesional valido';
  }

  if (!serviceLocations || serviceLocations.length === 0) {
    return 'Debes agregar al menos una localidad donde ofreces tus servicios';
  }

  if (!whatsapp?.trim()) {
    return 'El WhatsApp es requerido';
  }

  const whatsappError = validateWhatsAppNumber(whatsapp);
  if (whatsappError) {
    return `WhatsApp invalido: ${whatsappError}`;
  }

  if (!services || services.length === 0) {
    return 'Debes agregar al menos un servicio';
  }

  for (const [index, service] of services.entries()) {
    if (!service.categoryId?.trim()) {
      return `La categoria del servicio ${index + 1} es requerida`;
    }

    if (!service.description?.trim()) {
      return `La descripcion del servicio ${index + 1} es requerida`;
    }
  }

  return null;
}

function registrationAuditSnapshot(input: {
  user: Omit<PrismaUser, 'password'>;
  professional: PrismaProfessional | null;
  servicesCount: number;
  skipEmailVerification: boolean;
  emailVerificationQueued: boolean;
}) {
  return {
    userId: input.user.id,
    email: input.user.email,
    firstName: input.user.firstName,
    lastName: input.user.lastName,
    dni: input.user.dni,
    gender: input.user.gender,
    verified: input.user.verified,
    professionalId: input.professional?.id ?? null,
    professionalStatus: input.professional?.status ?? null,
    professionalGroup: input.professional?.professionalGroup ?? null,
    servicesCount: input.servicesCount,
    skipEmailVerification: input.skipEmailVerification,
    emailVerificationQueued: input.emailVerificationQueued,
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
      gender,
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
    const validationError = validateRegistrationPayload(payload);

    if (validationError) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.register',
        status: 'warning',
        summary: 'Intento de registro con datos invalidos',
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
        fail('validation_error', validationError, undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const normalizedExperienceYears = normalizeExperienceYears(experienceYears) ?? 0;
    const normalizedDni = dni?.trim() ?? '';
    const categorySlugs = Array.from(
      new Set((services ?? []).map((service) => service.categoryId.trim()).filter(Boolean)),
    );

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

    const categories = await prisma.category.findMany({
      where: {
        slug: { in: categorySlugs },
        active: true,
      },
      select: { id: true, slug: true },
    });
    const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
    const missingCategory = categorySlugs.find((slug) => !categoryBySlug.has(slug));

    if (missingCategory) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'auth',
        eventName: 'auth.register',
        status: 'warning',
        summary: `Intento de registro con categoria inexistente: ${missingCategory}`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        metadata: {
          categorySlug: missingCategory,
        },
      });

      return observedJson(
        context,
        fail('validation_error', `La categoria ${missingCategory} no existe o no esta disponible`, undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) },
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
          gender: gender || null,
          dni: normalizedDni,
          phone: phone || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          location: location || null,
          ...(skipEmailVerification ? { verified: true, emailVerifiedAt: new Date() } : {}),
        },
      });

      let professional: PrismaProfessional | null = null;

      if (bio || experienceYears || (services && services.length > 0) || professionalGroup) {
        const groupToUse = professionalGroup || 'oficios';

        await tx.categoryGroup.upsert({
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
          servicesCreateData = services.map((s: ServiceFormInput) => {
            const category = categoryBySlug.get(s.categoryId.trim());
            if (!category) {
              throw new Error('Categoria no encontrada');
            }
            return {
              categoryId: category.id,
              title: s.title,
              description: s.description,
              categoryGroup: professionalGroup || undefined,
            };
          });
        }

        professional = await tx.professional.create({
          data: {
            userId: user.id,
            bio: bio || '',
            experienceYears: normalizedExperienceYears,
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

    let emailVerificationQueued = false;

    if (!skipEmailVerification && result.token) {
      try {
        const emailJob = await enqueueEmailVerify({
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
        emailVerificationQueued = Boolean(emailJob);
      } catch (e) {
        console.error('Error encolando correo de verificacion (v1):', e);
      }
    }

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
          emailVerificationQueued,
        }),
      ),
      metadata: {
        hasProfessional: Boolean(result.professional),
      },
    });

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
      emailVerificationQueued && result.token && process.env.NODE_ENV !== 'production'
        ? (() => {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
            const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
            return `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(
              userWithoutPassword.email,
            )}`;
          })()
        : undefined;
    const message = skipEmailVerification
      ? 'Usuario registrado exitosamente. La verificacion por email esta deshabilitada temporalmente.'
      : emailVerificationQueued
        ? 'Usuario registrado. Te enviamos un correo para confirmar la cuenta.'
        : 'Usuario registrado. No pudimos enviar el correo de verificacion; solicita un nuevo enlace desde la pantalla de verificacion.';

    return observedJson(
      context,
      ok(
        {
          message,
          user: userWithoutPassword,
          professional: result.professional,
          emailVerificationRequired: !skipEmailVerification,
          emailVerificationQueued,
          emailVerificationDisabled: skipEmailVerification,
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
