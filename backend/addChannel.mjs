#!/usr/bin/env node
import 'dotenv/config';

import url from 'url';

import minimost from 'minimost';

import { addChannel } from './db.mjs';
import { updateHomePage } from './lib.mjs';
import { error, logMemoryUsage, logTimeSpent } from './util.mjs';
import { youTubeVideosList } from './youtubeApi.mjs';
import QuotaTracker from './youtubeQuota.mjs';

const { flags: options, input: youtubeIds } = minimost(process.argv.slice(2), {
  string: ['status', 'default-category', 'type'],
  boolean: ['force'],
  alias: {
    f: 'force',
    s: 'status',
    c: 'default-category',
    t: 'type',
  },
});

(async () => {
  const { force } = options;
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'add_channel', force });

  console.log('Starting add:channels');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  for (const id of youtubeIds) {
    try {
      // either get the video ID from the querystring, or get a channel ID from different URL formats
      const youtubeId =
        url.parse(id, true)?.query?.v ||
        id.replace(/https:\/\/(www.)?(youtu.be\/|youtube\.com\/channel\/)/, '');

      // channel IDs all start with U
      const channelId = youtubeId?.startsWith('UC')
        ? youtubeId
        : (await youTubeVideosList({ ids: [youtubeId], quotaTracker }))?.[0]?.snippet?.channelId;

      if (!channelId) throw Error('No channel found');

      await addChannel({
        data: {
          youtubeId: channelId,
          status: options.status?.toUpperCase(),
          type: options.type?.toUpperCase(),
          defaultCategory: options.defaultCategory?.toUpperCase(),
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
