/*
  Warnings:

  - The values [Review,PortfolioReview] on the enum `ChannelLinkType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'REVIEW';
ALTER TYPE "Category" ADD VALUE 'PORTFOLIOREVIEW';

-- AlterEnum
BEGIN;
CREATE TYPE "ChannelLinkType_new" AS ENUM ('Twitter', 'FacebooK', 'LinkedIn', 'GitHub', 'Twitch', 'Instagram', 'Homepage', 'Blog', 'YouTube', 'Patreon', 'Shop', 'Discord', 'Links', 'Link', 'TikTok');
ALTER TABLE "ChannelLink" ALTER COLUMN "type" TYPE "ChannelLinkType_new" USING ("type"::text::"ChannelLinkType_new");
ALTER TYPE "ChannelLinkType" RENAME TO "ChannelLinkType_old";
ALTER TYPE "ChannelLinkType_new" RENAME TO "ChannelLinkType";
DROP TYPE "ChannelLinkType_old";
COMMIT;
