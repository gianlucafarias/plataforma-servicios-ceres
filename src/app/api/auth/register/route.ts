import { NextRequest, NextResponse } from 'next/server';
import { type User as PrismaUser, type Professional as PrismaProfessional } from '@prisma/client';
import type { CategoryGroup } from '@/types';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/utils';
import { enqueueEmailVerify } from '@/jobs/email.producer';
import { enqueueSlackAlert } from '@/jobs/slack.producer';


export async function POST(request: NextRequest) {
  try {
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
      services?: ServiceFormInput[];
    }

    const {
      email,
      password,
      firstName,
      lastName,
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
      services,
    }: RegisterRequestPayload = await request.json();

    // Validar datos requeridos
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transacción: crear usuario, profesional y servicios
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          location: location || null,
          // si picture se usa a futuro, guardar en otro modelo; por ahora ignorado
        }
      });

      let professional: PrismaProfessional | null = null;

      // Si vienen datos profesionales, crear el perfil
      if (bio || experienceYears || (services && services.length > 0) || professionalGroup) {
        const categoryGroupRecord = professionalGroup
          ? await tx.categoryGroup.upsert({
              where: { id: professionalGroup },
              update: {},
              create: {
                id: professionalGroup,
                name: professionalGroup === 'oficios' ? 'Oficios' : 'Profesiones',
                slug: professionalGroup,
              },
            })
          : null;

        // Mapear category slug -> crear/usar Category y devolver su id
        let servicesCreateData: Array<{ categoryId: string; title: string; description: string; categoryGroup?: CategoryGroup }> | undefined = undefined;
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
                    groupId: categoryGroupRecord ? categoryGroupRecord.id : 'oficios',
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
            professionalGroup: professionalGroup || null,
            location: location || null,
            whatsapp: whatsapp || null,
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
            services: servicesCreateData && servicesCreateData.length > 0 ? {
              create: servicesCreateData,
            } : undefined,
          }
        });
      }

      // Crear token de verificación
      const token = generateRandomToken(48)
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
      await tx.verificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        }
      })

      return { user, professional, token };
    });

    const { password: _dbPassword, ...userWithoutPassword } = result.user as PrismaUser;
    void _dbPassword;

    // Encolar correo de verificación (procesamiento asíncrono)
    // El worker se encargará de enviarlo con retries automáticos
    try {
      await enqueueEmailVerify({
        userId: userWithoutPassword.id,
        token: result.token,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName || undefined,
      });
    } catch (e) {
      console.error('Error encolando correo de verificación:', e);
      // En desarrollo, imprimir info de debug
      if (process.env.NODE_ENV !== 'production') {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
        const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(userWithoutPassword.email)}`;
        console.log('Verification URL (dev):', verifyUrl);
      }
    }

    // Notificar a Slack cuando se registre un nuevo profesional pendiente
    if (result.professional) {
      try {
        await enqueueSlackAlert(
          `prof:new:${result.professional.id}`,
          `🔔 Nuevo profesional registrado (pendiente):\n*${userWithoutPassword.firstName} ${userWithoutPassword.lastName}*\nEmail: ${userWithoutPassword.email}\nGrupo: ${result.professional.professionalGroup || 'N/A'}\nServicios: ${services?.length || 0}`
        );
      } catch (slackError) {
        // No fallar si Slack falla
        console.error('Error enviando alerta a Slack:', slackError);
      }
    }

    const devVerifyUrl = process.env.NODE_ENV !== 'production' 
      ? (() => {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
          const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
          return `${origin}/auth/verify?token=${encodeURIComponent(result.token)}&email=${encodeURIComponent(userWithoutPassword.email)}`;
        })()
      : undefined

    return NextResponse.json({
      message: 'Usuario registrado. Te enviamos un correo para confirmar la cuenta.',
      user: userWithoutPassword,
      professional: result.professional,
      ...(devVerifyUrl ? { devVerifyUrl } : {}),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('Error al registrar usuario:', message);
    const isValidation = message.toLowerCase().includes('categoría no encontrada') || message.toLowerCase().includes('faltan datos');
    return NextResponse.json(
      { error: message },
      { status: isValidation ? 400 : 500 }
    );
  } 
}