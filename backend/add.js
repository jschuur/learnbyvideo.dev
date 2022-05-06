import { youtube } from '@googleapis/youtube';
import 'dotenv/config';

import prisma from './prisma.js';

const Youtube = youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

async function updateChannel(channelId) {
  console.log(`Processing channel ID ${channelId}`);

  try {
    const res = await Youtube.channels.list({
      part: 'snippet,statistics',
      id: channelId,
    });

    const channelData = res.data.items[0].snippet;

    const channelFields = {
      youtubeId: res.data.items[0].id,
      channelName: channelData.title,
      description: channelData.description,
      customUrl: channelData.customUrl,
      country: channelData.country,
      publishedAt: channelData.publishedAt,

      thumbnail: channelData.thumbnails.default.url,
      thumbnailMedium: channelData.thumbnails.medium.url,
      thumbnailHigh: channelData.thumbnails.high.url,

      statistics: res.data.items[0].statistics,
    };

    await prisma.channel.upsert({
      where: {
        youtubeId: channelId,
      },
      create: channelFields,
      update: channelFields,
    });

    console.log(`Processed ${channelData.title}`);
  } catch ({ message }) {
    console.error(`Error processing channel ID ${channelId}: ${message}`);
  }
}

(async () => {
  for (const channelId of process.argv.slice(2)) await updateChannel(channelId);

  await prisma.$disconnect();
})();
