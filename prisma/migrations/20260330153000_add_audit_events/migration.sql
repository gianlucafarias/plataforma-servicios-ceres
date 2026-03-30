-- CreateEnum
CREATE TYPE "public"."AuditEventKind" AS ENUM ('audit', 'workflow', 'request');

-- CreateEnum
CREATE TYPE "public"."AuditActorType" AS ENUM ('admin_user', 'end_user', 'system');

-- CreateEnum
CREATE TYPE "public"."AuditEventStatus" AS ENUM ('success', 'failure', 'warning', 'skipped');

-- CreateTable
CREATE TABLE "public"."audit_events" (
    "id" TEXT NOT NULL,
    "kind" "public"."AuditEventKind" NOT NULL,
    "domain" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "actorType" "public"."AuditActorType" NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "requestId" TEXT,
    "route" TEXT,
    "method" TEXT,
    "status" "public"."AuditEventStatus" NOT NULL,
    "durationMs" INTEGER,
    "summary" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "public"."audit_events"("createdAt");

-- CreateIndex
CREATE INDEX "audit_events_domain_idx" ON "public"."audit_events"("domain");

-- CreateIndex
CREATE INDEX "audit_events_requestId_idx" ON "public"."audit_events"("requestId");

-- CreateIndex
CREATE INDEX "audit_events_actorId_idx" ON "public"."audit_events"("actorId");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_idx" ON "public"."audit_events"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_kind_status_idx" ON "public"."audit_events"("kind", "status");
