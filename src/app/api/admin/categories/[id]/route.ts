import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          select: { id: true, name: true, slug: true },
          orderBy: { name: 'asc' },
        },
        services: {
          take: 10,
          include: {
            professional: {
              select: {
                id: true,
                rating: true,
                verified: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        _count: {
          select: { children: true, services: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Categoria no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        type: category.parentCategoryId ? 'subcategory' : 'area',
        name: category.name,
        slug: category.slug,
        group: category.groupId,
        parentId: category.parentCategoryId,
        image: category.backgroundUrl,
        description: category.description,
        active: category.active,
        parent: category.parent,
        subcategories: category.children,
        professionals: category.services.map((service) => service.professional),
        _count: category._count,
      },
    });
  } catch (error) {
    console.error('Error obteniendo categoria:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Categoria no encontrada' },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      description?: string;
      backgroundUrl?: string | null;
      active?: boolean;
      parentCategoryId?: string | null;
    } = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.backgroundUrl = body.image;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.parentId !== undefined) {
      if (body.parentId) {
        const parent = await prisma.category.findUnique({ where: { id: body.parentId } });
        if (!parent) {
          return NextResponse.json(
            { success: false, error: 'not_found', message: 'Area padre no encontrada' },
            { status: 404 }
          );
        }
      }

      updateData.parentCategoryId = body.parentId;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Categoria actualizada correctamente',
    });
  } catch (error) {
    console.error('Error actualizando categoria:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar categoria' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const deactivate = searchParams.get('deactivate') === 'true';

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true, services: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Categoria no encontrada' },
        { status: 404 }
      );
    }

    if (!force && (category._count.children > 0 || category._count.services > 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'conflict',
          message: `No se puede eliminar: tiene ${category._count.children} subcategorias y ${category._count.services} servicios asociados`,
          details: {
            subcategoryCount: category._count.children,
            professionalCount: category._count.services,
          },
        },
        { status: 409 }
      );
    }

    if (deactivate) {
      const updated = await prisma.category.update({
        where: { id },
        data: { active: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Categoria desactivada exitosamente',
        data: { id: updated.id, active: false },
      });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Categoria eliminada exitosamente',
      affected: {
        subcategories: category._count.children,
        professionals: category._count.services,
      },
    });
  } catch (error) {
    console.error('Error eliminando categoria:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al eliminar categoria' },
      { status: 500 }
    );
  }
}
