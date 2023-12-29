-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "customUrl" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT,
    "thumbnail" TEXT NOT NULL,
    "thumbnailMedium" TEXT NOT NULL,
    "thumbnailHigh" TEXT NOT NULL,
    "statistics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_youtubeId_key" ON "Channel"("youtubeId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_customUrl_key" ON "Channel"("customUrl");
