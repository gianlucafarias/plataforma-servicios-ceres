-- CreateEnum
CREATE TYPE "public"."CategorySuggestionStatus" AS ENUM ('open', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."CategorySuggestionPerspective" AS ENUM ('provider', 'seeker');

-- CreateTable
CREATE TABLE "public"."category_suggestions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."CategorySuggestionStatus" NOT NULL DEFAULT 'open',
    "userId" TEXT,
    "userEmail" TEXT,
    "origin" TEXT,
    "url" TEXT,
    "context" JSONB,
    "adminNotes" TEXT,
    "relatedCategoryId" TEXT,
    "perspective" "public"."CategorySuggestionPerspective",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_suggestions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."category_suggestions" ADD CONSTRAINT "category_suggestions_relatedCategoryId_fkey" FOREIGN KEY ("relatedCategoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_suggestions" ADD CONSTRAINT "category_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
