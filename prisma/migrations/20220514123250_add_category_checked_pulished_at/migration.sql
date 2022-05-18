-- CreateEnum
CREATE TYPE "Category" AS ENUM ('TUTORIAL', 'SOFTSKILL', 'SHOW', 'TALK', 'VLOG', 'OTHER', 'NONE');

-- CreateEnum
CREATE TYPE "ChannelLinkType" AS ENUM ('Twitter', 'FacebooK', 'LinkedIn', 'GitHub', 'Twitch', 'Instagram', 'Homepage', 'YouTube', 'Shop', 'Link');

-- AlterEnum
ALTER TYPE "ChannelType" ADD VALUE 'EVENT';

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "defaultCategory" "Category",
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "lastPublishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "category" "Category";

-- CreateTable
CREATE TABLE "ChannelLink" (
    "id" SERIAL NOT NULL,
    "channelId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "type" "ChannelLinkType" NOT NULL,

    CONSTRAINT "ChannelLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChannelLink" ADD CONSTRAINT "ChannelLink_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
