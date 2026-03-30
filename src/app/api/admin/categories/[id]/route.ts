import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { isCategoryIconKey } from '@/lib/category-icon-keys';
import { buildChanges, finalizeObservedResponse, observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createRequestObservationContext } from '@/lib/observability/context';

export const dynamic = 'force-dynamic';

function normalizeIcon(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  if (!isCategoryIconKey(value)) {
    throw new Error('invalid_icon');
  }

  return value;
}

function canShowOnHome(type: 'area' | 'subcategory', group: string) {
  return type === 'area' || group === 'profesiones';
}

function resolveCategoryType(category: {
  groupId: string;
  parentCategoryId: string | null;
}): 'area' | 'subcategory' {
  return category.groupId === 'oficios' && !category.parentCategoryId ? 'area' : 'subcategory';
}

function categoryAuditSnapshot(category: {
  id: string;
  name: string;
  slug: string;
  groupId: string;
  parentCategoryId: string | null;
  icon: string | null;
  backgroundUrl: string | null;
  description: string;
  active: boolean;
  showOnHome: boolean;
}) {
  return {
    id: category.id,
    type: resolveCategoryType(category),
    name: category.name,
    slug: category.slug,
    groupId: category.groupId,
    parentCategoryId: category.parentCategoryId,
    icon: category.icon,
    backgroundUrl: category.backgroundUrl,
    description: category.description,
    active: category.active,
    showOnHome: category.showOnHome,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/categories/[id]',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

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
      return observedJson(
        context,
        { success: false, error: 'not_found', message: 'Categoria no encontrada' },
        { status: 404 },
      );
    }

    return observedJson(context, {
      success: true,
      data: {
        id: category.id,
        type: resolveCategoryType(category),
        name: category.name,
        slug: category.slug,
        group: category.groupId,
        parentId: category.parentCategoryId,
        icon: category.icon,
        image: category.backgroundUrl,
        description: category.description,
        active: category.active,
        showOnHome: category.showOnHome,
        parent: category.parent,
        subcategories: category.children,
        professionals: category.services.map((service) => service.professional),
        _count: category._count,
      },
    });
  } catch (error) {
    console.error('Error obteniendo categoria:', error);
    return observedJson(context, { success: false, error: 'server_error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/categories/[id]',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return observedJson(
        context,
        { success: false, error: 'not_found', message: 'Categoria no encontrada' },
        { status: 404 },
      );
    }

    const updateData: {
      name?: string;
      description?: string;
      icon?: string | null;
      backgroundUrl?: string | null;
      active?: boolean;
      showOnHome?: boolean;
      parentCategoryId?: string | null;
    } = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) {
      try {
        updateData.icon = normalizeIcon(body.icon);
      } catch {
        return observedJson(
          context,
          {
            success: false,
            error: 'validation_error',
            message: 'Icono invalido. Debe pertenecer al catalogo permitido',
          },
          { status: 400 },
        );
      }
    }
    if (body.image !== undefined) updateData.backgroundUrl = body.image;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.showOnHome !== undefined) {
      const categoryType = resolveCategoryType(existing);
      if (body.showOnHome && !canShowOnHome(categoryType, existing.groupId)) {
        return observedJson(
          context,
          {
            success: false,
            error: 'validation_error',
            message:
              'Solo las areas de oficios y las categorias de profesiones pueden mostrarse en el inicio',
          },
          { status: 400 },
        );
      }

      updateData.showOnHome = body.showOnHome;
    }
    if (body.parentId !== undefined) {
      if (body.parentId) {
        const parent = await prisma.category.findUnique({ where: { id: body.parentId } });
        if (!parent) {
          return observedJson(
            context,
            { success: false, error: 'not_found', message: 'Area padre no encontrada' },
            { status: 404 },
          );
        }
      }

      updateData.parentCategoryId = body.parentId;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'admin.categories',
      eventName: 'category.update',
      status: 'success',
      summary: `Categoria ${updated.slug} actualizada`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'category',
      entityId: updated.id,
      changes: buildChanges(
        categoryAuditSnapshot(existing),
        categoryAuditSnapshot(updated),
      ),
    });

    revalidateTag('categories');

    return observedJson(context, {
      success: true,
      data: updated,
      message: 'Categoria actualizada correctamente',
    });
  } catch (error) {
    console.error('Error actualizando categoria:', error);
    return observedJson(
      context,
      { success: false, error: 'server_error', message: 'Error al actualizar categoria' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/categories/[id]',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

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
      return observedJson(
        context,
        { success: false, error: 'not_found', message: 'Categoria no encontrada' },
        { status: 404 },
      );
    }

    if (!force && (category._count.children > 0 || category._count.services > 0)) {
      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'admin.categories',
        eventName: 'category.delete',
        status: 'warning',
        summary: `Intento de eliminar categoria ${category.slug} bloqueado por dependencias`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'category',
        entityId: category.id,
        metadata: {
          force,
          deactivate,
          subcategoryCount: category._count.children,
          serviceCount: category._count.services,
        },
      });

      return observedJson(
        context,
        {
          success: false,
          error: 'conflict',
          message: `No se puede eliminar: tiene ${category._count.children} subcategorias y ${category._count.services} servicios asociados`,
          details: {
            subcategoryCount: category._count.children,
            professionalCount: category._count.services,
          },
        },
        { status: 409 },
      );
    }

    if (deactivate) {
      const updated = await prisma.category.update({
        where: { id },
        data: { active: false },
      });

      await safeRecordAuditEvent({
        kind: 'audit',
        domain: 'admin.categories',
        eventName: 'category.deactivate',
        status: 'success',
        summary: `Categoria ${updated.slug} desactivada`,
        actor: context.actor,
        requestId: context.requestId,
        route: context.route,
        method: context.method,
        entityType: 'category',
        entityId: updated.id,
        changes: buildChanges(
          categoryAuditSnapshot(category),
          categoryAuditSnapshot(updated),
        ),
        metadata: {
          force,
        },
      });

      revalidateTag('categories');

      return observedJson(context, {
        success: true,
        message: 'Categoria desactivada exitosamente',
        data: { id: updated.id, active: false },
      });
    }

    await prisma.category.delete({ where: { id } });

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'admin.categories',
      eventName: 'category.delete',
      status: 'success',
      summary: `Categoria ${category.slug} eliminada`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'category',
      entityId: category.id,
      changes: buildChanges(categoryAuditSnapshot(category), null),
      metadata: {
        force,
        subcategoryCount: category._count.children,
        serviceCount: category._count.services,
      },
    });

    revalidateTag('categories');

    return observedJson(context, {
      success: true,
      message: 'Categoria eliminada exitosamente',
      affected: {
        subcategories: category._count.children,
        professionals: category._count.services,
      },
    });
  } catch (error) {
    console.error('Error eliminando categoria:', error);
    return observedJson(
      context,
      { success: false, error: 'server_error', message: 'Error al eliminar categoria' },
      { status: 500 },
    );
  }
}
