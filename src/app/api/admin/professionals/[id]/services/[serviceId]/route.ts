import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { Prisma, CategoryGroupId } from '@prisma/client';

/**
 * PUT /api/admin/professionals/:professionalId/services/:serviceId
 * Actualiza un servicio existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id: professionalId, serviceId } = await params;
    const body = await request.json();

    // Verificar que el profesional existe
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId }
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el servicio existe y pertenece al profesional
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    if (existingService.professionalId !== professionalId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'forbidden', 
          message: 'El servicio no pertenece al profesional especificado' 
        },
        { status: 403 }
      );
    }

    // Validaciones de campos opcionales
    if (body.title !== undefined) {
      if (body.title.length < 3 || body.title.length > 200) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'validation_error', 
            message: 'El título debe tener entre 3 y 200 caracteres' 
          },
          { status: 400 }
        );
      }
    }

    if (body.description !== undefined) {
      if (body.description.length < 10 || body.description.length > 2000) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'validation_error', 
            message: 'La descripción debe tener entre 10 y 2000 caracteres' 
          },
          { status: 400 }
        );
      }
    }

    if (body.priceRange !== undefined && body.priceRange.length > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'validation_error', 
          message: 'El rango de precios no puede exceder 100 caracteres' 
        },
        { status: 400 }
      );
    }

    // Si se envía categoryId, validar que existe y es una subcategoría activa
    if (body.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId }
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'not_found', message: 'Categoría no encontrada' },
          { status: 404 }
        );
      }

      if (!category.parentCategoryId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'validation_error', 
            message: 'La categoría debe ser una subcategoría, no un área' 
          },
          { status: 400 }
        );
      }

      if (!category.active) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'validation_error', 
            message: 'La categoría no está activa' 
          },
          { status: 400 }
        );
      }
    }

    // Construir datos de actualización
    const updateData: Prisma.ServiceUncheckedUpdateInput = {};

    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId;
      // Actualizar categoryGroup si se cambia la categoría
      if (body.categoryId) {
        const newCategory = await prisma.category.findUnique({
          where: { id: body.categoryId },
          select: { groupId: true }
        });
        if (newCategory && (newCategory.groupId === 'oficios' || newCategory.groupId === 'profesiones')) {
          updateData.categoryGroup = newCategory.groupId as CategoryGroupId;
        }
      }
    }
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priceRange !== undefined) updateData.priceRange = body.priceRange;
    if (body.available !== undefined) updateData.available = Boolean(body.available);

    // Actualizar el servicio
    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            groupId: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        professionalId: updated.professionalId,
        categoryId: updated.categoryId,
        title: updated.title,
        description: updated.description,
        priceRange: updated.priceRange,
        available: updated.available,
        categoryGroup: updated.categoryGroup,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      message: 'Servicio actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar servicio' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/professionals/:professionalId/services/:serviceId
 * Elimina un servicio
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id: professionalId, serviceId } = await params;

    // Verificar que el profesional existe
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId }
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el servicio existe y pertenece al profesional
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    if (service.professionalId !== professionalId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'forbidden', 
          message: 'El servicio no pertenece al profesional especificado' 
        },
        { status: 403 }
      );
    }

    // Eliminar el servicio (hard delete)
    await prisma.service.delete({
      where: { id: serviceId }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: serviceId
      },
      message: 'Servicio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}
