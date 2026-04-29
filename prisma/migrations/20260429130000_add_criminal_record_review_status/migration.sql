CREATE TYPE "CriminalRecordReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "professional_documentation"
  ADD COLUMN "criminalRecordStatus" "CriminalRecordReviewStatus",
  ADD COLUMN "criminalRecordReviewedAt" TIMESTAMP(3),
  ADD COLUMN "criminalRecordAdminNotes" TEXT;
