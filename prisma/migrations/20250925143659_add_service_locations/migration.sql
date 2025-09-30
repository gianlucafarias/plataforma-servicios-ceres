-- AlterTable
ALTER TABLE "public"."professionals" ADD COLUMN     "serviceLocations" TEXT[] DEFAULT ARRAY[]::TEXT[];
