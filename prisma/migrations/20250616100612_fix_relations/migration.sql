/*
  Warnings:

  - You are about to drop the column `appwriteId` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ProjectFile` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `lastActive` on the `Session` table. All the data in the column will be lost.
  - Added the required column `email` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `ProjectFile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PasswordResetToken_token_idx";

-- DropIndex
DROP INDEX "Project_ownerId_idx";

-- DropIndex
DROP INDEX "ProjectFile_projectId_idx";

-- DropIndex
DROP INDEX "ProjectFile_uploadedById_idx";

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProjectFile" DROP COLUMN "appwriteId",
DROP COLUMN "createdAt",
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "ipAddress",
DROP COLUMN "lastActive";

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
