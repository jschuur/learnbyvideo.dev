/*
  Warnings:

  - Made the column `duration` on table `Video` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "hiddenSubscriberCount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriberCount" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "videoCount" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT -1,
ALTER COLUMN "thumbnail" DROP NOT NULL,
ALTER COLUMN "thumbnailMedium" DROP NOT NULL,
ALTER COLUMN "thumbnailHigh" DROP NOT NULL,
ALTER COLUMN "statistics" DROP NOT NULL;

UPDATE "Video" SET duration=-1;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "commentCount" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "youtubeTags" TEXT[],
ALTER COLUMN "thumbnail" DROP NOT NULL,
ALTER COLUMN "views" SET DEFAULT -1,
ALTER COLUMN "starRating" DROP NOT NULL,
ALTER COLUMN "duration" SET NOT NULL,
ALTER COLUMN "duration" SET DEFAULT -1;
