-- CreateEnum
CREATE TYPE "public"."BugReportStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "public"."BugReportSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "public"."bug_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."BugReportStatus" NOT NULL DEFAULT 'open',
    "severity" "public"."BugReportSeverity" NOT NULL DEFAULT 'medium',
    "userId" TEXT,
    "userEmail" TEXT,
    "context" JSONB,
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."bug_reports" ADD CONSTRAINT "bug_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
