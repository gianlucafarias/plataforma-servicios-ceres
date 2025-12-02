import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

// GET: Listar todas las categorías
export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'area' o 'subcategory'
    const group = searchParams.get('group'); // 'oficios' o 'profesiones'
    const search = searchParams.get('search');

    const where: Prisma.CategoryWhereInput = {};

    // Filtrar por tipo
    if (type === 'area') {
      where.parentCategoryId = null;
      where.groupId = 'oficios'; // Solo oficios tienen áreas
    } else if (type === 'subcategory') {
      where.parentCategoryId = { not: null };
    }

    // Filtrar por grupo
    if (group && ['oficios', 'profesiones'].includes(group)) {
      where.groupId = group;
    }

    // Búsqueda por nombre o slug
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { slug: { contains: search, mode: Prisma.QueryMode.insensitive } }
      ];
    }

    const [categories, areas, subcatOficios, subcatProfesiones] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: {
            select: { 
              children: true,
              services: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      // Áreas (solo oficios, sin padre)
      prisma.category.findMany({
        where: { groupId: 'oficios', parentCategoryId: null },
        include: {
          _count: { select: { children: true, services: true } }
        },
        orderBy: { name: 'asc' }
      }),
      // Subcategorías de oficios (con padre)
      prisma.category.findMany({
        where: { groupId: 'oficios', parentCategoryId: { not: null } },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { services: true } }
        },
        orderBy: { name: 'asc' }
      }),
      // Subcategorías de profesiones (sin padre)
      prisma.category.findMany({
        where: { groupId: 'profesiones' },
        include: {
          _count: { select: { services: true } }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    // Si hay filtros, devolver solo la lista filtrada
    if (type || group || search) {
      const data = categories.map(cat => ({
        id: cat.id,
        type: cat.parentCategoryId ? 'subcategory' : 'area',
        name: cat.name,
        slug: cat.slug,
        group: cat.groupId,
        parentId: cat.parentCategoryId,
        parentSlug: cat.parent?.slug,
        image: cat.backgroundUrl,
        description: cat.description,
        active: cat.active,
        subcategoryCount: cat._count.children,
        professionalCount: cat._count.services,
        createdAt: (cat as typeof cat & { createdAt: Date; updatedAt: Date }).createdAt.toISOString(),
        updatedAt: (cat as typeof cat & { createdAt: Date; updatedAt: Date }).updatedAt.toISOString()
      }));

      return NextResponse.json({ success: true, data });
    }

    // Sin filtros, devolver estructura completa organizada
    const data = {
      areas: areas.map(area => ({
        id: area.id,
        name: area.name,
        slug: area.slug,
        group: area.groupId,
        image: area.backgroundUrl,
        description: area.description,
        active: area.active,
        subcategoryCount: area._count.children,
        createdAt: (area as typeof area & { createdAt: Date; updatedAt: Date }).createdAt.toISOString(),
        updatedAt: (area as typeof area & { createdAt: Date; updatedAt: Date }).updatedAt.toISOString()
      })),
      subcategoriesOficios: subcatOficios.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        group: sub.groupId,
        areaId: sub.parentCategoryId,
        areaSlug: sub.parent?.slug,
        image: sub.backgroundUrl,
        description: sub.description,
        active: sub.active,
        professionalCount: sub._count.services,
        createdAt: (sub as typeof sub & { createdAt: Date; updatedAt: Date }).createdAt.toISOString(),
        updatedAt: (sub as typeof sub & { createdAt: Date; updatedAt: Date }).updatedAt.toISOString()
      })),
      subcategoriesProfesiones: subcatProfesiones.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        group: sub.groupId,
        areaId: null,
        areaSlug: null,
        image: sub.backgroundUrl,
        description: sub.description,
        active: sub.active,
        professionalCount: sub._count.services,
        createdAt: (sub as typeof sub & { createdAt: Date; updatedAt: Date }).createdAt.toISOString(),
        updatedAt: (sub as typeof sub & { createdAt: Date; updatedAt: Date }).updatedAt.toISOString()
      })),
      stats: {
        totalAreas: areas.length,
        totalSubcategoriesOficios: subcatOficios.length,
        totalSubcategoriesProfesiones: subcatProfesiones.length,
        totalCategories: areas.length + subcatOficios.length + subcatProfesiones.length
      }
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva categoría
export async function POST(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { type, name, slug, group, parentId, description, image, active = true } = body;

    // Validaciones
    if (!name || !slug || !group || !type) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Campos requeridos: name, slug, group, type' },
        { status: 400 }
      );
    }

    if (!['oficios', 'profesiones'].includes(group)) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Grupo debe ser "oficios" o "profesiones"' },
        { status: 400 }
      );
    }

    if (!['area', 'subcategory'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Type debe ser "area" o "subcategory"' },
        { status: 400 }
      );
    }

    // Reglas de negocio
    if (type === 'area' && group !== 'oficios') {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Solo el grupo "oficios" puede tener áreas' },
        { status: 400 }
      );
    }

    if (type === 'subcategory' && group === 'oficios' && !parentId) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Las subcategorías de oficios requieren un área padre (parentId)' },
        { status: 400 }
      );
    }

    // Verificar que el slug no exista
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'El slug ya existe' },
        { status: 400 }
      );
    }

    // Verificar que el área padre exista (si aplica)
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'not_found', message: 'Área padre no encontrada' },
          { status: 404 }
        );
      }
    }

    // Crear categoría
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || name,
        groupId: group,
        parentCategoryId: type === 'area' ? null : (parentId || null),
        backgroundUrl: image || null,
        active
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        type
      },
      message: 'Categoría creada exitosamente'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creando categoría:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}