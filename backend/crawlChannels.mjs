import 'dotenv/config';

import minimost from 'minimost';
import pluralize from 'pluralize';
import { CrawlState } from '@prisma/client';

const options = minimost(process.argv.slice(2), {
  string: ['max-channels'],
  boolean: ['force'],
  alias: {
    c: 'max-channels',
    c: 'force',
  },
}).flags;

import { getChannels, upsertVideos, updateChannel } from './db.mjs';
import { error, logTimeSpent, logMemoryUsage } from './util.mjs';
import { QuotaTracker } from './youtubeQuota.mjs';
import { crawlChannel } from './youtube.mjs';

import config from './config.mjs';

// Crawls new channels for videos (e.g. is a channel was added quickly from a bookmarklet)
(async () => {
  const { force } = options;
  let crawlState;
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'crawl_channels', force });

  console.log('Starting crawl:channels');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  // Get all the channels that still need crawling
  const channels = await getChannels({
    where: { crawlState: CrawlState.PENDING },
    take: options.maxChannels ? parseInt(options.maxChannels) : undefined,
  });

  console.log(`Crawling ${pluralize('channel', channels.length, true)}...`);

  for (const channel of channels) {
    try {
      const videos = await crawlChannel({ channel, quotaTracker });
      if (videos?.length) await upsertVideos(videos);

      crawlState = CrawlState.COMPLETED;
    } catch ({ message }) {
      crawlState = CrawlState.ERROR;

      error(message);
    }

    await updateChannel({ id: channel.id, lastCheckedAt: new Date(startTime), crawlState });

    await quotaTracker.checkUsage();
  }

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();
