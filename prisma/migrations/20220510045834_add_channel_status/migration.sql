-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('ACTIVE', 'PAUSED', 'HIDDEN', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "status" "ChannelStatus" NOT NULL DEFAULT E'ACTIVE';
