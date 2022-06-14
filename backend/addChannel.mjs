#!/usr/bin/env node
import 'dotenv/config';

import minimost from 'minimost';

import { addChannel } from './db.mjs';
import { error, logMemoryUsage, logTimeSpent } from './util.mjs';
import { youTubeVideosList } from './youtubeApi.mjs';
import { QuotaTracker } from './youtubeQuota.mjs';
import { updateHomePage } from './lib.mjs';

const { flags: options, input: youtubeIds } = minimost(process.argv.slice(2), {
  string: ['status', 'default-category'],
  alias: {
    s: 'status',
    c: 'default-category',
  },
});

(async () => {
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'add_channel' });

  console.log('Starting add:channels');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  for (const id of youtubeIds) {
    try {
      const youtubeId = id.startsWith('UC')
        ? id
        : (await youTubeVideosList({ ids: [id], quotaTracker }))?.[0]?.snippet?.channelId;

      if (!youtubeId) throw Error('No channel found');

      // NOTE: This will not capture upcoming or live videos, as this is not part of the 'uploads' playlist used here.
      await addChannel({
        data: {
          youtubeId,
          status: options.status || undefined,
          defaultCategory: options.defaultCategory || undefined,
        },
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
