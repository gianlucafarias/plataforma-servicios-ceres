-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('citizen', 'professional', 'admin');

-- CreateEnum
CREATE TYPE "public"."ProfessionalStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "public"."CategoryGroupId" AS ENUM ('oficios', 'profesiones');

-- CreateEnum
CREATE TYPE "public"."ContactRequestStatus" AS ENUM ('pending', 'contacted', 'closed');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "role" "public"."UserRole" NOT NULL DEFAULT 'professional',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "category_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "backgroundUrl" TEXT,
    "groupId" TEXT NOT NULL,
    "parentCategoryId" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professionals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "experienceYears" INTEGER DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ProfessionalStatus" NOT NULL DEFAULT 'pending',
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "location" TEXT,
    "schedule" JSONB,
    "specialties" TEXT[],
    "professionalGroup" "public"."CategoryGroupId",

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryGroup" "public"."CategoryGroupId",
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL DEFAULT '',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_requests" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "message" TEXT NOT NULL,
    "status" "public"."ContactRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "category_groups_slug_key" ON "public"."category_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_userId_key" ON "public"."professionals"("userId");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."category_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professionals" ADD CONSTRAINT "professionals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_requests" ADD CONSTRAINT "contact_requests_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_requests" ADD CONSTRAINT "contact_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_requests" ADD CONSTRAINT "contact_requests_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
