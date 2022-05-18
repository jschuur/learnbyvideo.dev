-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT E'en';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "language" TEXT;
