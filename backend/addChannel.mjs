#!/usr/bin/env node
import 'dotenv/config';

import { addChannel } from './db.mjs';
import { error, logMemoryUsage, logTimeSpent } from './util.mjs';
import { youTubeVideosList } from './youtubeApi.mjs';
import { QuotaTracker } from './youtubeQuota.mjs';
import { updateHomePage } from './lib.mjs';

(async () => {
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker('add_channel');

  console.log('Starting add:channels');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  for (const id of process.argv.slice(2)) {
    try {
      const youtubeId = id.startsWith('UC')
        ? id
        : (await youTubeVideosList({ ids: [id], quotaTracker }))?.[0]?.snippet?.channelId;

      if (!youtubeId) throw Error('No channel found');

      await addChannel({
        youtubeId,
        lastCheckedAt: new Date(startTime),
        quotaTracker,
        crawlVideos: true,
      });

      await quotaTracker.checkUsage();
    } catch ({ message }) {
      error(`Couldn't add channel from ID ${id}: ${message}`);
    }
  }

  if (process.env.NODE_ENV === 'production') await updateHomePage();

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();