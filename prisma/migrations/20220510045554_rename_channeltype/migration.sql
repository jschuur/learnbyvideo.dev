/*
  Warnings:

  - You are about to drop the column `channelType` on the `Channel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel"
RENAME COLUMN "channelType" to "type";
