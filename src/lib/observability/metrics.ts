import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';
import type {
  ObservabilityEventKind,
  ObservabilityEventStatus,
} from '@/lib/observability/context';

type MetricsState = {
  registry: Registry;
  httpRequestsTotal: Counter<'method' | 'route' | 'status_code'>;
  httpRequestDurationMs: Histogram<'method' | 'route' | 'status_code'>;
  auditEventsTotal: Counter<'kind' | 'domain' | 'event_name' | 'status'>;
  emailEventsTotal: Counter<'channel' | 'template' | 'status'>;
};

const metricsGlobal = globalThis as typeof globalThis & {
  __ceresServicesMetricsState?: MetricsState;
  __ceresServicesDefaultMetricsStarted?: boolean;
};

function createMetricsState(): MetricsState {
  const registry = new Registry();

  return {
    registry,
    httpRequestsTotal: new Counter({
      name: 'ceres_services_http_requests_total',
      help: 'Total de requests HTTP de la plataforma de servicios',
      labelNames: ['method', 'route', 'status_code'],
      registers: [registry],
    }),
    httpRequestDurationMs: new Histogram({
      name: 'ceres_services_http_request_duration_ms',
      help: 'Duracion de requests HTTP en milisegundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [registry],
    }),
    auditEventsTotal: new Counter({
      name: 'ceres_services_audit_events_total',
      help: 'Eventos de observabilidad/auditoria persistidos por la plataforma',
      labelNames: ['kind', 'domain', 'event_name', 'status'],
      registers: [registry],
    }),
    emailEventsTotal: new Counter({
      name: 'ceres_services_email_events_total',
      help: 'Intentos de correo registrados por la plataforma',
      labelNames: ['channel', 'template', 'status'],
      registers: [registry],
    }),
  };
}

function getMetricsState(): MetricsState {
  if (!metricsGlobal.__ceresServicesMetricsState) {
    metricsGlobal.__ceresServicesMetricsState = createMetricsState();
  }

  if (!metricsGlobal.__ceresServicesDefaultMetricsStarted) {
    const enabled = (process.env.OBS_DEFAULT_METRICS_ENABLED ?? 'true')
      .trim()
      .toLowerCase();

    if (enabled === 'true') {
      collectDefaultMetrics({
        prefix: process.env.OBS_METRICS_PREFIX || 'ceres_services_',
        register: metricsGlobal.__ceresServicesMetricsState.registry,
      });
    }

    metricsGlobal.__ceresServicesDefaultMetricsStarted = true;
  }

  return metricsGlobal.__ceresServicesMetricsState;
}

export const observabilityMetrics = {
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ) {
    const labels = {
      method: method.toUpperCase(),
      route,
      status_code: String(statusCode),
    };

    const state = getMetricsState();
    state.httpRequestsTotal.inc(labels);
    state.httpRequestDurationMs.observe(labels, Math.max(durationMs, 0));
  },

  recordAuditEvent(
    kind: ObservabilityEventKind,
    domain: string,
    eventName: string,
    status: ObservabilityEventStatus,
  ) {
    getMetricsState().auditEventsTotal.inc({
      kind,
      domain,
      event_name: eventName,
      status,
    });
  },

  recordEmailEvent(
    channel: 'smtp' | 'resend',
    template: string,
    status: 'requested' | 'sent' | 'failed' | 'skipped',
  ) {
    getMetricsState().emailEventsTotal.inc({
      channel,
      template,
      status,
    });
  },

  async getMetrics() {
    return getMetricsState().registry.metrics();
  },

  getContentType() {
    return getMetricsState().registry.contentType;
  },
};
