import 'dotenv/config';

import prisma from './prisma.js';
import { saveVideos, saveChannel } from './db.js';
import { getRecentVideosFromRSS, getChannelInfo } from './lib.js';

async function updateChannel(channelId) {
  console.log(`Processing channel ID ${channelId}`);

  try {
    const channelData = await getChannelInfo(channelId);
    await saveChannel(channelData);

    console.log(`Adding latest videos for ${channelData.title}`);

    const channel = await prisma.channel.findUnique({ where: { youtubeId: channelId } });
    const videos = await getRecentVideosFromRSS(channel);

    await saveVideos({ videos, channel });
  } catch ({ message }) {
    console.error(`Error processing channel ID ${channelId}: ${message}`);
  }
}

(async () => {
  for (const channelId of process.argv.slice(2)) await updateChannel(channelId);

  await prisma.$disconnect();
})();
