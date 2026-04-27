import { NextRequest, NextResponse } from 'next/server';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { getAbsoluteUrl } from '@/lib/seo';
import { observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import {
  createRequestObservationContext,
  createSystemActor,
  resolveAdminActor,
} from '@/lib/observability/context';

type ReminderType = 'verify_account' | 'missing_criminal_record';
type ReminderWindow = 'd1' | 'd3' | 'd7';

type PendingReminderItem = {
  entityType: 'user' | 'professional';
  entityId: string;
  email: string;
  firstName?: string;
  templateKey:
    | 'services.reminder_verify_account'
    | 'services.reminder_missing_criminal_record';
  payload: Record<string, unknown>;
  idempotencyKey: string;
  source: 'plataforma-servicios-ceres';
  domain: 'auth.email' | 'professional.documentation';
  summary: string;
};

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

function getApiKey(request: NextRequest) {
  return (
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '')
  );
}

function isAuthorized(apiKey: string | null) {
  if (!apiKey) {
    return false;
  }

  const allowed = [process.env.OPS_API_KEY, process.env.ADMIN_API_KEY].filter(
    (v): v is string => Boolean(v),
  );
  return allowed.includes(apiKey);
}

function parseType(value: string | null): ReminderType | null {
  if (value === 'verify_account' || value === 'missing_criminal_record') {
    return value;
  }
  return null;
}

function parseWindow(value: string | null): ReminderWindow | null {
  if (value === 'd1' || value === 'd3' || value === 'd7') {
    return value;
  }
  return null;
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}

function getWindowMs(window: ReminderWindow): number {
  switch (window) {
    case 'd1':
      return 24 * 60 * 60 * 1000;
    case 'd3':
      return 3 * 24 * 60 * 60 * 1000;
    case 'd7':
      return 7 * 24 * 60 * 60 * 1000;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: createdAt.toISOString(),
      id,
    }),
    'utf8',
  ).toString('base64');
}

function decodeCursor(cursor: string | null): { createdAt: Date; id: string } | null {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as {
      createdAt?: string;
      id?: string;
    };
    if (!parsed.createdAt || !parsed.id) {
      return null;
    }
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const meta = requestMeta(request);
  const context = createRequestObservationContext(request, {
    route: '/api/v1/ops/reminders/pending',
    requestId: meta.requestId,
    actor: createSystemActor('ops-reminders-pending'),
  });
  const apiKey = getApiKey(request);

  if (!apiKey) {
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'ops.reminders',
      eventName: 'ops.reminders_pending.fetch',
      status: 'warning',
      summary: 'Consulta de pendientes rechazada por API key ausente',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
    });
    return observedJson(
      context,
      fail('unauthorized', 'API key requerida', undefined, meta),
      { status: 401 },
    );
  }

  if (!isAuthorized(apiKey)) {
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'ops.reminders',
      eventName: 'ops.reminders_pending.fetch',
      status: 'warning',
      summary: 'Consulta de pendientes rechazada por API key invalida',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
    });
    return observedJson(
      context,
      fail('forbidden', 'API key invalida', undefined, meta),
      { status: 403 },
    );
  }
  context.actor = resolveAdminActor(request, context.requestId);

  const searchParams = request.nextUrl.searchParams;
  const type = parseType(searchParams.get('type'));
  const window = parseWindow(searchParams.get('window'));
  const limit = parseLimit(searchParams.get('limit'));
  const cursor = decodeCursor(searchParams.get('cursor'));

  if (!type) {
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'ops.reminders',
      eventName: 'ops.reminders_pending.fetch',
      status: 'warning',
      summary: 'Consulta de pendientes con parametro type invalido',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        type: searchParams.get('type'),
        window: searchParams.get('window'),
      },
    });
    return observedJson(
      context,
      fail(
        'validation_error',
        'Parametro type invalido. Valores permitidos: verify_account | missing_criminal_record',
        undefined,
        meta,
      ),
      { status: 400 },
    );
  }

  if (!window) {
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'ops.reminders',
      eventName: 'ops.reminders_pending.fetch',
      status: 'warning',
      summary: 'Consulta de pendientes con parametro window invalido',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        type,
        window: searchParams.get('window'),
      },
    });
    return observedJson(
      context,
      fail(
        'validation_error',
        'Parametro window invalido. Valores permitidos: d1 | d3 | d7',
        undefined,
        meta,
      ),
      { status: 400 },
    );
  }

  const cutoff = new Date(Date.now() - getWindowMs(window));

  try {
    let data: PendingReminderItem[] = [];
    let nextCursor: string | null = null;

    if (type === 'verify_account') {
      const users = await prisma.user.findMany({
        where: {
          verified: false,
          createdAt: { lte: cutoff },
          NOT: { email: '' },
          ...(cursor
            ? {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        select: {
          id: true,
          email: true,
          firstName: true,
          createdAt: true,
        },
      });

      const hasMore = users.length > limit;
      const page = hasMore ? users.slice(0, limit) : users;
      const last = page.at(-1);
      nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

      data = page.map((user) => ({
        entityType: 'user',
        entityId: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        templateKey: 'services.reminder_verify_account',
        payload: {
          firstName: user.firstName || undefined,
          verificationUrl: getAbsoluteUrl(
            `/auth/verify?email=${encodeURIComponent(user.email)}`,
          ),
        },
        idempotencyKey: `reminder.verify_email:${user.id}:${window}`,
        source: 'plataforma-servicios-ceres',
        domain: 'auth.email',
        summary: `Recordatorio de verificacion de cuenta (${window}) para usuario ${user.id}`,
      }));
    } else {
      const professionals = await prisma.professional.findMany({
        where: {
          requiresDocumentation: true,
          createdAt: { lte: cutoff },
          user: {
            email: { not: '' },
          },
          OR: [
            { documentation: null },
            {
              documentation: {
                is: { criminalRecordObjectKey: null },
              },
            },
          ],
          ...(cursor
            ? {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      const hasMore = professionals.length > limit;
      const page = hasMore ? professionals.slice(0, limit) : professionals;
      const last = page.at(-1);
      nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

      data = page.map((professional) => ({
        entityType: 'professional',
        entityId: professional.id,
        email: professional.user.email,
        firstName: professional.user.firstName || undefined,
        templateKey: 'services.reminder_missing_criminal_record',
        payload: {
          firstName: professional.user.firstName || undefined,
          documentsUrl: getAbsoluteUrl('/dashboard/settings'),
        },
        idempotencyKey: `reminder.criminal_record:${professional.id}:${window}`,
        source: 'plataforma-servicios-ceres',
        domain: 'professional.documentation',
        summary: `Recordatorio de certificado penal pendiente (${window}) para profesional ${professional.id}`,
      }));
    }

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'ops.reminders',
      eventName: 'ops.reminders_pending.fetch',
      status: 'success',
      summary: `Pendientes de recordatorios obtenidos (${type}/${window})`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        type,
        window,
        limit,
        cursorPresent: Boolean(searchParams.get('cursor')),
        itemsFetched: data.length,
        nextCursorPresent: Boolean(nextCursor),
      },
    });

    return observedJson(
      context,
      {
        success: true,
        data,
        pagination: {
          nextCursor,
          limit,
        },
        meta,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error obteniendo pendientes de recordatorios:', error);
    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'ops.reminders',
      eventName: 'ops.reminders_pending.fetch',
      status: 'failure',
      summary: 'Error al obtener pendientes de recordatorios',
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      metadata: {
        type,
        window,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    return observedJson(
      context,
      fail('server_error', 'Error al obtener pendientes de recordatorios', undefined, meta),
      { status: 500 },
    );
  }
}

