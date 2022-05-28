/*
  Warnings:

  - You are about to drop the column `statistics` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `starRating` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `views` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "statistics";

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "starRating",
DROP COLUMN "thumbnail",
DROP COLUMN "views";
