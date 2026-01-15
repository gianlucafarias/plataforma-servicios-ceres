import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { DaySchedule } from '@/lib/availability';

/**
 * POST /api/ceres-en-red/buscar
 * Endpoint de búsqueda para el bot de WhatsApp (Ceresito)
 * 
 * Busca profesionales y servicios según query, categoría y barrio
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, categoria, barrio, limit: limitParam, offset: offsetParam } = body;

    // Validaciones
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El campo "query" es requerido y debe ser un string no vacío',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Validar y normalizar limit (default: 5, máximo: 10)
    const limit = Math.min(10, Math.max(1, parseInt(limitParam) || 5));
    const offset = Math.max(0, parseInt(offsetParam) || 0);

    // Construir filtros base
    const professionalFilters: Prisma.ProfessionalWhereInput = {
      status: 'active',
    };

    // Filtro por barrio/ubicación
    if (barrio && typeof barrio === 'string') {
      const barrioLower = barrio.trim().toLowerCase();
      professionalFilters.AND = [
        {
          OR: [
            { serviceLocations: { has: barrioLower } },
            { serviceLocations: { has: 'all-region' } },
            { location: { contains: barrioLower, mode: Prisma.QueryMode.insensitive } },
            {
              user: {
                location: { contains: barrioLower, mode: Prisma.QueryMode.insensitive }
              }
            }
          ]
        }
      ];
    }

    // Búsqueda por texto (query)
    const queryLower = query.trim().toLowerCase();
    
    // Construir condiciones de búsqueda
    const searchConditions: Prisma.ServiceWhereInput[] = [
      // Buscar en título del servicio
      { title: { contains: queryLower, mode: Prisma.QueryMode.insensitive } },
      // Buscar en descripción del servicio
      { description: { contains: queryLower, mode: Prisma.QueryMode.insensitive } },
      // Buscar en nombre de categoría
      { category: { name: { contains: queryLower, mode: Prisma.QueryMode.insensitive } } },
      // Buscar en nombre del profesional
      {
        professional: {
          OR: [
            { user: { firstName: { contains: queryLower, mode: Prisma.QueryMode.insensitive } } },
            { user: { lastName: { contains: queryLower, mode: Prisma.QueryMode.insensitive } } },
            { bio: { contains: queryLower, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      }
    ];

    // Construir where final
    const where: Prisma.ServiceWhereInput = {
      available: true,
      professional: professionalFilters,
      OR: searchConditions,
    };

    // Filtro por categoría (buscar por nombre de categoría)
    if (categoria && typeof categoria === 'string') {
      const categoriaLower = categoria.trim().toLowerCase();
      where.category = {
        name: {
          contains: categoriaLower,
          mode: Prisma.QueryMode.insensitive
        }
      };
    }

    // Contar total de resultados
    const total = await prisma.service.count({ where });

    // Obtener servicios con ordenamiento personalizado
    // Ordenar por: disponible (true primero), luego calificación, luego cantidad de reseñas
    const services = await prisma.service.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        professional: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                location: true
              }
            }
          }
        }
      },
      take: limit,
      skip: offset,
    });

    // Ordenar manualmente: disponible primero, luego rating, luego reviewCount
    const sortedServices = services.sort((a, b) => {
      // Prioridad 1: disponible (true primero)
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      // Prioridad 2: Mayor calificación
      const ratingA = a.professional.rating || 0;
      const ratingB = b.professional.rating || 0;
      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }
      // Prioridad 3: Más reseñas
      const reviewsA = a.professional.reviewCount || 0;
      const reviewsB = b.professional.reviewCount || 0;
      return reviewsB - reviewsA;
    });

    // Formatear resultados según el esquema requerido
    const resultados = sortedServices.map((service) => {
      const prof = service.professional;
      const user = prof.user;
      const nombreCompleto = `${user.firstName} ${user.lastName}`.trim();

      // Formatear WhatsApp (asegurar formato +549XXXXXXXXX)
      let whatsappFormatted = prof.whatsapp || user.phone || null;
      if (whatsappFormatted) {
        // Normalizar formato de WhatsApp
        whatsappFormatted = whatsappFormatted.replace(/\s+/g, ''); // Quitar espacios
        if (!whatsappFormatted.startsWith('+')) {
          // Si no empieza con +, agregar código de país argentino
          if (whatsappFormatted.startsWith('54')) {
            whatsappFormatted = '+' + whatsappFormatted;
          } else if (whatsappFormatted.startsWith('9')) {
            whatsappFormatted = '+54' + whatsappFormatted;
          } else {
            whatsappFormatted = '+549' + whatsappFormatted;
          }
        }
      }

      // Formatear horarios desde schedule (JSON)
      let horarios = '';
      if (prof.schedule && typeof prof.schedule === 'object') {
        try {
          const schedule = prof.schedule as Record<string, DaySchedule | unknown>;
          const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          const horariosArray: string[] = [];
          
          (Object.keys(schedule) as Array<keyof typeof schedule>).forEach((dia) => {
            const diaData = schedule[dia] as DaySchedule | undefined;
            if (diaData && (diaData.morning?.enabled || diaData.afternoon?.enabled)) {
              const partes: string[] = [];
              if (diaData.morning?.enabled) {
                partes.push(`${diaData.morning.start || ''}-${diaData.morning.end || ''}`);
              }
              if (diaData.afternoon?.enabled) {
                partes.push(`${diaData.afternoon.start || ''}-${diaData.afternoon.end || ''}`);
              }
              if (partes.length > 0) {
                const diaNombre = dias.find(d => d.toLowerCase().startsWith(dia.toLowerCase().substring(0, 3))) || dia;
                horariosArray.push(`${diaNombre}: ${partes.join(', ')}`);
              }
            }
          });
          
          if (horariosArray.length > 0) {
            horarios = horariosArray.join(' | ');
          }
        } catch (e) {
          // Si hay error parseando schedule, dejar vacío
        }
      }

      // Determinar barrio desde serviceLocations o location
      let barrioValue = '';
      if (prof.serviceLocations && prof.serviceLocations.length > 0) {
        // Tomar la primera ubicación que no sea 'all-region'
        const location = prof.serviceLocations.find(loc => loc !== 'all-region');
        if (location) {
          barrioValue = location;
        }
      }
      if (!barrioValue && prof.location) {
        barrioValue = prof.location;
      }
      if (!barrioValue && user.location) {
        barrioValue = user.location;
      }

      return {
        id: parseInt(prof.id.replace(/-/g, '').substring(0, 8), 16) || Math.abs(prof.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)), // Convertir UUID a número para compatibilidad
        nombre: nombreCompleto,
        servicio: service.title,
        descripcion: service.description || '',
        categoria: service.category.name,
        telefono: user.phone || null,
        whatsapp: whatsappFormatted,
        instagram: prof.instagram || null,
        facebook: prof.facebook || null,
        direccion: prof.physicalStoreAddress || prof.location || user.location || null,
        barrio: barrioValue || null,
        calificacion: prof.rating || 0,
        reseñas: prof.reviewCount || 0,
        disponible: service.available,
        horarios: horarios || null,
      };
    });

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      resultados
    });

  } catch (error) {
    console.error('Error en búsqueda ceres-en-red:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al realizar la búsqueda',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
