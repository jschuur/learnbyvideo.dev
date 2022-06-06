-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "reviewed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "reviewed" BOOLEAN NOT NULL DEFAULT false;
