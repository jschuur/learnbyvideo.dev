/*
  Warnings:

  - You are about to drop the column `crawled` on the `Channel` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CrawlState" AS ENUM ('PENDING', 'COMPLETED', 'ERROR');

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "crawled",
ADD COLUMN     "crawlState" "CrawlState" NOT NULL DEFAULT E'PENDING';
