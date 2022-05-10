-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('BRAND', 'INDIVIDUAL', 'COLLABORATION', 'SHOW', 'OTHER');

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "channelType" "ChannelType" NOT NULL DEFAULT E'INDIVIDUAL';
