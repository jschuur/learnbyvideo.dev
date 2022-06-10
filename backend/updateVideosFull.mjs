import 'dotenv/config';

import delay from 'delay';
import minimost from 'minimost';
import pluralize from 'pluralize';

import { getVideos, updateVideos } from './db.mjs';
import { getVideoDetails } from './youtube.mjs';
import { QuotaTracker } from './youtubeQuota.mjs';
import { logTimeSpent, logMemoryUsage } from './util.mjs';

const options = minimost(process.argv.slice(2), {
  string: ['limit', 'offset', 'min-last-published', 'order-by'],
  boolean: ['force'],
  default: { limit: '50', offset: 0, 'order-by': 'checked' },
  alias: {
    l: 'limit',
    m: 'min-last-published',
    o: 'offset',
    b: 'order-by',
    f: 'force',
  },
}).flags;

(async () => {
  const { minLastPublished, limit, offset, orderBy, force } = options;
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'update_videos_full', force });

  console.log('Starting update:videos');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  const videos = await getVideos({
    where: {
      publishedAt: {
        gte: minLastPublished
          ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(minLastPublished, 10))
          : new Date(0),
      },
    },
    take: minLastPublished ? undefined : parseInt(limit, 10),
    skip: minLastPublished ? undefined : parseInt(offset, 10),
    orderBy: orderBy === 'checked' ? { lastCheckedAt: 'asc' } : { publishedAt: 'desc' },
    include: { channel: true },
  });

  console.log(`Updating ${pluralize('video', videos.length, true)} videos...`);

  const videoUpdates = await getVideoDetails({
    videos,
    part: 'snippet,statistics,contentDetails,liveStreamingDetails',
    quotaTracker,
  });

  await updateVideos(videoUpdates);

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();
