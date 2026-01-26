import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

/**
 * POST /api/admin/professionals/:professionalId/services
 * Crea un nuevo servicio para un profesional
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id: professionalId } = await params;
    const body = await request.json();

    const { categoryId, title, description, priceRange, available = true } = body;

    // Validaciones
    if (!categoryId || !title || !description) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'validation_error', 
          message: 'Campos requeridos: categoryId, title, description' 
        },
        { status: 400 }
      );
    }

    // Validar longitud de campos
    if (title.length < 3 || title.length > 200) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'validation_error', 
          message: 'El título debe tener entre 3 y 200 caracteres' 
        },
        { status: 400 }
      );
    }

    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'validation_error', 
          message: 'La descripción debe tener entre 10 y 2000 caracteres' 
        },
        { status: 400 }
      );
    }

    if (priceRange && priceRange.length > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'validation_error', 
          message: 'El rango de precios no puede exceder 100 caracteres' 
        },
        { status: 400 }
      );
    }

    // Verificar que el profesional existe y está activo
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      include: { user: true }
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la categoría existe y es una subcategoría (no un área)
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Validar que es una subcategoría (debe tener parentCategoryId)
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

    // Validar que la categoría está activa
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

    // Crear el servicio
    const service = await prisma.service.create({
      data: {
        professionalId,
        categoryId,
        categoryGroup: professional.professionalGroup || null,
        title,
        description,
        priceRange: priceRange || '',
        available: Boolean(available),
      },
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
        id: service.id,
        professionalId: service.professionalId,
        categoryId: service.categoryId,
        title: service.title,
        description: service.description,
        priceRange: service.priceRange,
        available: service.available,
        categoryGroup: service.categoryGroup,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
      message: 'Servicio creado exitosamente'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creando servicio:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al crear servicio' },
      { status: 500 }
    );
  }
}
