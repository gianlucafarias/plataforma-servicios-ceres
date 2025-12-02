# Plataforma de Servicios Ceres

Plataforma web del Gobierno de la Ciudad de Ceres para conectar vecinos con profesionales y oficios verificados.

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

## Instalación

```bash
npm install
cp .env.example .env  # Completar con tus valores
npx prisma migrate deploy
npm run db:seed
```

## Desarrollo

```bash
npm run dev          # App en http://localhost:3000
npm run worker:dev   # Worker de colas (emails, archivos)
npm run queues:ui:dev # Dashboard de colas en http://localhost:3050
```

## Producción

```bash
npm run build
npm start            # o usar PM2 con ecosystem.config.js
```

## Testing

```bash
npm run test:unit    # Tests unitarios
npm run test:int     # Tests de integración
npm run test:e2e     # Tests end-to-end
npm run lint         # Linter
npm run typecheck    # Verificar tipos
```

## Estructura

```
src/
├── app/           # Rutas y páginas (Next.js App Router)
├── components/    # Componentes React
├── hooks/         # Custom hooks
├── jobs/          # Productores y workers de colas
├── lib/           # Utilidades (prisma, redis, mail, etc)
└── types/         # Tipos TypeScript
```

## Variables de entorno

Ver `.env.example` para la lista completa.

