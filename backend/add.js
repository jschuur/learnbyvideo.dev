#!/usr/bin/env node
import 'dotenv/config';

import { addChannelByYouTubeChannelId, updateChannel } from './db.js';
import { getVideoInfo } from './youtube.js';
import { error } from './util.js';

(async () => {
  const lastCheckedAt = new Date();

  for (const id of process.argv.slice(2)) {
    try {
      const youtubeId = id.startsWith('UC')
        ? id
        : (await getVideoInfo(id)).data.items[0].snippet.channelId;

      await addChannelByYouTubeChannelId({ youtubeId, lastCheckedAt });
    } catch ({ message }) {
      error(`Couldn't add channel from ID ${id}: ${message}`);
    }
  }

  await prisma.$disconnect();
})();
