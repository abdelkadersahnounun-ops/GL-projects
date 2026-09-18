/*
  Warnings:

  - Added the required column `thumbnailKey` to the `avatars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnailKey` to the `backgrounds` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "avatars" ADD COLUMN     "thumbnailKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "backgrounds" ADD COLUMN     "assetKey" TEXT,
ADD COLUMN     "thumbnailKey" TEXT NOT NULL,
ALTER COLUMN "assetUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "captionText" TEXT;
