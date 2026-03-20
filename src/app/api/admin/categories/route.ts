import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const group = searchParams.get('group');
    const search = searchParams.get('search');

    const where: Prisma.CategoryWhereInput = {};

    if (type === 'area') {
      where.parentCategoryId = null;
      where.groupId = 'oficios';
    } else if (type === 'subcategory') {
      where.parentCategoryId = { not: null };
    }

    if (group && ['oficios', 'profesiones'].includes(group)) {
      where.groupId = group;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [categories, areas, subcategoriesOficios, subcategoriesProfesiones] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              children: true,
              services: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: { groupId: 'oficios', parentCategoryId: null },
        include: {
          _count: { select: { children: true, services: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: { groupId: 'oficios', parentCategoryId: { not: null } },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { services: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: { groupId: 'profesiones' },
        include: {
          _count: { select: { services: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    if (type || group || search) {
      return NextResponse.json({
        success: true,
        data: categories.map((category) => ({
          id: category.id,
          type: category.parentCategoryId ? 'subcategory' : 'area',
          name: category.name,
          slug: category.slug,
          group: category.groupId,
          parentId: category.parentCategoryId,
          parentSlug: category.parent?.slug,
          image: category.backgroundUrl,
          description: category.description,
          active: category.active,
          subcategoryCount: category._count.children,
          professionalCount: category._count.services,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        areas: areas.map((area) => ({
          id: area.id,
          name: area.name,
          slug: area.slug,
          group: area.groupId,
          image: area.backgroundUrl,
          description: area.description,
          active: area.active,
          subcategoryCount: area._count.children,
        })),
        subcategoriesOficios: subcategoriesOficios.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          group: subcategory.groupId,
          areaId: subcategory.parentCategoryId,
          areaSlug: subcategory.parent?.slug,
          image: subcategory.backgroundUrl,
          description: subcategory.description,
          active: subcategory.active,
          professionalCount: subcategory._count.services,
        })),
        subcategoriesProfesiones: subcategoriesProfesiones.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          group: subcategory.groupId,
          areaId: null,
          areaSlug: null,
          image: subcategory.backgroundUrl,
          description: subcategory.description,
          active: subcategory.active,
          professionalCount: subcategory._count.services,
        })),
        stats: {
          totalAreas: areas.length,
          totalSubcategoriesOficios: subcategoriesOficios.length,
          totalSubcategoriesProfesiones: subcategoriesProfesiones.length,
          totalCategories:
            areas.length + subcategoriesOficios.length + subcategoriesProfesiones.length,
        },
      },
    });
  } catch (error) {
    console.error('Error obteniendo categorias:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener categorias' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { type, name, slug, group, parentId, description, image, active = true } = body;

    if (!name || !slug || !group || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Campos requeridos: name, slug, group, type',
        },
        { status: 400 }
      );
    }

    if (!['oficios', 'profesiones'].includes(group)) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Grupo debe ser "oficios" o "profesiones"',
        },
        { status: 400 }
      );
    }

    if (!['area', 'subcategory'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Type debe ser "area" o "subcategory"',
        },
        { status: 400 }
      );
    }

    if (type === 'area' && group !== 'oficios') {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Solo el grupo "oficios" puede tener areas',
        },
        { status: 400 }
      );
    }

    if (type === 'subcategory' && group === 'oficios' && !parentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Las subcategorias de oficios requieren un area padre (parentId)',
        },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'El slug ya existe' },
        { status: 400 }
      );
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'not_found', message: 'Area padre no encontrada' },
          { status: 404 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || name,
        groupId: group,
        parentCategoryId: type === 'area' ? null : parentId || null,
        backgroundUrl: image || null,
        active,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...category,
          type,
        },
        message: 'Categoria creada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando categoria:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al crear categoria' },
      { status: 500 }
    );
  }
}
