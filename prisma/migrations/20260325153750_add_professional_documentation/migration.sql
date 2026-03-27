-- AlterTable
ALTER TABLE "public"."professionals" ADD COLUMN     "requiresDocumentation" BOOLEAN NOT NULL DEFAULT true;

-- Rollout: los profesionales existentes no quedan bloqueados por esta nueva regla.
UPDATE "public"."professionals"
SET "requiresDocumentation" = false;

-- CreateTable
CREATE TABLE "public"."professional_documentation" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "criminalRecordObjectKey" TEXT,
    "criminalRecordFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professional_labor_references" (
    "id" TEXT NOT NULL,
    "documentationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "attachmentObjectKey" TEXT,
    "attachmentFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_labor_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_documentation_professionalId_key" ON "public"."professional_documentation"("professionalId");

-- AddForeignKey
ALTER TABLE "public"."professional_documentation" ADD CONSTRAINT "professional_documentation_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professional_labor_references" ADD CONSTRAINT "professional_labor_references_documentationId_fkey" FOREIGN KEY ("documentationId") REFERENCES "public"."professional_documentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
