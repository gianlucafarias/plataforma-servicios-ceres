# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma y Sharp
RUN apk add --no-cache libc6-compat openssl

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build-time arguments para variables que Next.js necesita incrustar en el cliente
ARG NEXT_PUBLIC_BASE_URL
ARG NEXTAUTH_URL
ARG DATABASE_URL

# Exponerlas como variables de entorno para el proceso de build
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_DB_CHECKS=1

# Build de la aplicación
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Cambiar ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]