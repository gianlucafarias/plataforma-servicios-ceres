-- AlterTable
ALTER TABLE "public"."professionals" ADD COLUMN     "hasPhysicalStore" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "physicalStoreAddress" TEXT;
