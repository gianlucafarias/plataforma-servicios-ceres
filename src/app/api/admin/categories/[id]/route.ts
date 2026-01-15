import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

// GET: Obtener detalle de categoría
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
          orderBy: { name: 'asc' }
        },
        services: {
          take: 10,
          include: {
            professional: {
              select: {
                id: true,
                rating: true,
                verified: true,
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        _count: {
          select: { children: true, services: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const data = {
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
      professionals: category.services.map((s) => s.professional),
      _count: category._count
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que existe
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar solo campos permitidos
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
      // Verificar que el nuevo padre existe
      if (body.parentId) {
        const parent = await prisma.category.findUnique({ where: { id: body.parentId } });
        if (!parent) {
          return NextResponse.json(
            { success: false, error: 'not_found', message: 'Área padre no encontrada' },
            { status: 404 }
          );
        }
      }
      updateData.parentCategoryId = body.parentId;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Categoría actualizada correctamente'
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar categoría
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

    // Verificar que existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true, services: true } }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Si tiene subcategorías o profesionales, no permitir eliminación (a menos que force=true)
    if (!force && (category._count.children > 0 || category._count.services > 0)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'conflict', 
          message: `No se puede eliminar: tiene ${category._count.children} subcategorías y ${category._count.services} servicios asociados`,
          details: {
            subcategoryCount: category._count.children,
            professionalCount: category._count.services
          }
        },
        { status: 409 }
      );
    }

    // Soft delete (desactivar)
    if (deactivate) {
      const updated = await prisma.category.update({
        where: { id },
        data: { active: false }
      });

      return NextResponse.json({
        success: true,
        message: 'Categoría desactivada exitosamente',
        data: { id: updated.id, active: false }
      });
    }

    // Hard delete
    await prisma.category.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada exitosamente',
      affected: {
        subcategories: category._count.children,
        professionals: category._count.services
      }
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}