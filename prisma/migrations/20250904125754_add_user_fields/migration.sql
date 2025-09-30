/*
  Warnings:

  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ALTER COLUMN "name" DROP NOT NULL;
