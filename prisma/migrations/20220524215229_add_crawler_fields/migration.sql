-- CreateEnum
CREATE TYPE "QuotaUsageEndpoints" AS ENUM ('CHANNELSLIST', 'PLAYLISTITEMSLIST', 'VIDEOSLIST');

-- AlterEnum
ALTER TYPE "VideoStatus" ADD VALUE 'CRAWLING';

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "crawled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "duration" INTEGER;

-- CreateTable
CREATE TABLE "QuotaUsage" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "endpoint" "QuotaUsageEndpoints" NOT NULL,
    "parts" TEXT,
    "points" INTEGER NOT NULL,
    "task" TEXT,

    CONSTRAINT "QuotaUsage_pkey" PRIMARY KEY ("id")
);
