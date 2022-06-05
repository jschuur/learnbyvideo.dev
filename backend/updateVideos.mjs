import 'dotenv/config';

import delay from 'delay';
import { map } from 'lodash-es';
import minimost from 'minimost';
import pc from 'picocolors';
import pluralize from 'pluralize';

import { getActiveChannels, saveVideos, updateVideos, updateChannel } from './db.mjs';
import { logTimeSpent, logMemoryUsage } from './util.mjs';
import { getRecentVideosFromRSS, extractVideoInfo } from './youtube.mjs';
import { youTubeVideosList } from './youtubeApi.mjs';
import { QuotaTracker } from './youtubeQuota.mjs';
import { updateHomePage } from './lib.mjs';
import { error } from './util.mjs';

import config from './config.mjs';

const options = minimost(process.argv.slice(2), {
  string: ['min-last-updated', 'max-last-updated'],
  alias: {
    m: 'min-last-updated',
    x: 'max-last-updated',
    l: 'limit',
  },
}).flags;

async function getChannelsForUpdate({ minLastUpdated, maxLastUpdated, limit }) {
  console.log(`Looking for new videos... (${JSON.stringify({ minLastUpdated, maxLastUpdated })})`);

  const channels = await getActiveChannels({
    where: {
      OR: [
        {
          lastPublishedAt: {
            gte: minLastUpdated
              ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(options.minLastUpdated, 10))
              : new Date(0),
            lt: maxLastUpdated
              ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(options.maxLastUpdated, 10))
              : new Date(),
          },
        },
        {
          lastPublishedAt: null,
        },
      ],
    },
    orderBy: { lastPublishedAt: 'desc' },
    take: limit,
  });

  console.log(`Using ${pluralize('channel', channels.length, true)}`);

  return channels;
}
async function findNewVideos({ channels, quotaTracker, lastCheckedAt }) {
  let allNewVideos = [];

  for (const channel of channels) {
    const videos = await getRecentVideosFromRSS(channel);

    if (videos?.length) {
      const newVideos = await saveVideos({ videos, channel });

      allNewVideos.push(...newVideos);
    }

    if (videos !== undefined) await updateChannel({ id: channel.id, lastCheckedAt });

    // If we run out of quota in the middle of a check, at least we potentially still got some new videos
    if (await quotaTracker.checkUsage({ returnLimited: true })) break;

    await delay(config.RSS_FEED_UPDATE_DELAY_MS);
  }

  return allNewVideos;
}

// Get additional details for all the new videos via YouTube API
async function saveUpdatedVideoDetails({ videos, quotaTracker }) {
  if (!videos?.length) return;

  console.log(`Getting new video details for ${pluralize('new video', videos.length, true)}...`);

  const videoData = await youTubeVideosList({
    part: 'snippet,statistics,contentDetails',
    ids: videos.map((v) => v.youtubeId),
    quotaTracker,
  });

  await updateVideos(videoData.map((video) => extractVideoInfo(video)));
}


(async () => {
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker('update_videos');

  console.log('Starting update:videos');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  try {
    const channels = await getChannelsForUpdate(options);
    const videos = await findNewVideos({
      channels,
      quotaTracker,
      lastCheckedAt: new Date(startTime),
    });
    await saveUpdatedVideoDetails({ videos, quotaTracker });

    if (process.env.NODE_ENV === 'production' && videos.length) await updateHomePage();
  } catch ({ message }) {
    error(`${pc.red('Error')}: Problem looking for video updates: ${message}`);
  }

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();
