import { youtube } from '@googleapis/youtube';
import 'dotenv/config';

import prisma from './prisma.js';

const Youtube = youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

const CHANNEL_IDS = ['UCU5seEXTjpF4RRfQn-4242A'];

async function updateChannel(channelId) {
  console.log(`Updating channel ${channelId}`);

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
  } catch ({ message }) {
    console.error(`Error updating channel ${channelId}: ${message}`);
  }
}

(async () => {
  for (const channelId of CHANNEL_IDS) await updateChannel(channelId);

  await prisma.$disconnect();
})();
