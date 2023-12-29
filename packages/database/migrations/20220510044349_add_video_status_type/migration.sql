-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('UPCOMING', 'PUBLISHED', 'LIVE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('VIDEO', 'SHORT');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "status" "VideoStatus" NOT NULL DEFAULT E'PUBLISHED',
ADD COLUMN     "type" "VideoType" NOT NULL DEFAULT E'VIDEO';
