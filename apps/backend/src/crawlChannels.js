import 'dotenv-mono/load';

import { CrawlState } from 'database';
import minimost from 'minimost';
import pluralize from 'pluralize';

import { getChannels, updateChannel, upsertVideos } from './db.js';
import { error, logMemoryUsage, logTimeSpent } from './util.js';
import { crawlChannel } from './youtube.js';
import QuotaTracker from './youtubeQuota.js';

const options = minimost(process.argv.slice(2), {
  string: ['max-channels'],
  boolean: ['force'],
  alias: {
    c: 'max-channels',
    f: 'force',
  },
}).flags;

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
    take: options.maxChannels ? parseInt(options.maxChannels, 10) : undefined,
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
