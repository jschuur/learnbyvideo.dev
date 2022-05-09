#!/usr/bin/env node
import 'dotenv/config';

import prisma from './prisma.js';
import { saveVideos, saveChannel } from './db.js';
import { getRecentVideosFromRSS, getChannelInfo, getVideoInfo } from './lib.js';
import { error } from './util.js';

async function updateChannel(channelId) {
  console.log(`Processing channel ID ${channelId}`);

  try {
    const channelData = await getChannelInfo(channelId);
    await saveChannel(channelData);

    console.log(`Adding latest videos for ${channelData.channelName}`);

    const channel = await prisma.channel.findUnique({ where: { youtubeId: channelId } });
    const videos = await getRecentVideosFromRSS(channel);

    await saveVideos({ videos, channel });
  } catch ({ message }) {
    console.error(`Error processing channel ID ${channelId}: ${message}`);
  }
}

(async () => {
  for (const id of process.argv.slice(2)) {
    try {
      const youtubeId = id.startsWith('UC')
        ? id
        : (await getVideoInfo(id)).data.items[0].snippet.channelId;

      await updateChannel(youtubeId);
    } catch ({ message }) {
      error(`Couldn't add channel ${id}: ${message}`);
    }
  }

  await prisma.$disconnect();
})();
