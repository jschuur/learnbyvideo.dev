#!/usr/bin/env node
import 'dotenv/config';

import { addChannelByYouTubeChannelId, updateChannel } from './db.mjs';
import { getVideoInfo } from './youtube.mjs';
import { error } from './util.mjs';

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
})();
