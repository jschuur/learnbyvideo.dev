import 'dotenv-mono/load';

import config from 'config';
import delay from 'delay';
import { map } from 'lodash-es';
import minimost from 'minimost';
import pluralize from 'pluralize';

import {
  getMonitoredChannels,
  getRecheckVideos,
  removeKnownVideos,
  updateChannelMany,
  updateVideos,
  upsertVideos,
} from './db.js';
import { checkForDeletedVideos, updateHomePage } from './lib.js';
import { error, logMemoryUsage, logTimeSpent, warn } from './util.js';
import { getRecentVideosFromRSS, getVideoDetails } from './youtube.js';
import QuotaTracker from './youtubeQuota.js';

const options = minimost(process.argv.slice(2), {
  string: ['channels', 'min-last-updated', 'max-last-updated'],
  boolean: ['find-new-videos', 'recheck-videos', 'force'],
  default: {
    'find-new-videos': true,
    'recheck-videos': true,
  },
  alias: {
    c: 'channels',
    m: 'min-last-updated',
    x: 'max-last-updated',
    l: 'limit',
    f: 'force',
    n: 'find-new-videos',
    r: 'recheck-videos',
  },
}).flags;

async function getChannelsForUpdate({ minLastUpdated, maxLastUpdated, limit, channels }) {
  console.log(
    `Looking for new videos... (${JSON.stringify({
      minLastUpdated,
      maxLastUpdated,
      limit,
      channels,
    })})`
  );

  const channelsForUpdate = await getMonitoredChannels({
    where: channels
      ? { youtubeId: { in: channels.split(',') } }
      : {
          OR: [
            {
              lastPublishedAt: {
                gte: minLastUpdated
                  ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(minLastUpdated, 10))
                  : new Date(0),
                lt: maxLastUpdated
                  ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(maxLastUpdated, 10))
                  : new Date(),
              },
            },
            {
              lastPublishedAt: null,
            },
          ],
        },
    take: limit,
  });

  console.log(`Using ${pluralize('channel', channelsForUpdate.length, true)}`);

  return channelsForUpdate;
}

// Get the YouTube video IDs for new video from channels
async function findNewVideos(channels) {
  const allNewVideos = [];

  // Use RSS just to grab recent video IDs and see if we have them in the DB
  for (const channel of channels) {
    const recentVideos = await getRecentVideosFromRSS(channel);
    const newVideos = await removeKnownVideos(recentVideos);

    if (newVideos?.length) {
      console.log(`  Found ${pluralize('new video', newVideos.length, true)}`);

      allNewVideos.push(...newVideos);
    }

    // TODO use the API if a channel has more than 15 new videos
    if (newVideos?.length === 15)
      warn(`RSS feed for ${channel.channelName} has 15 new videos, check API for more`);

    // Don't spam the feed URLs
    await delay(config.RSS_FEED_UPDATE_DELAY_MS);
  }

  return allNewVideos;
}

(async () => {
  const { force } = options;
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'find_videos', force });

  console.log('Starting update:videos');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  try {
    // Include recent videos from the frequent recheck
    const recentVideosCondition = {
      publishedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * config.RECENT_VIDEOS_RECHECK_HOURS),
      },
    };

    // Also include recent videos in the recheck list
    const recheckVideos = options.recheckVideos
      ? await getRecheckVideos({
          include: recentVideosCondition,
        })
      : [];
    const channels = options.findNewVideos ? await getChannelsForUpdate(options) : [];
    const newVideos = options.findNewVideos ? await findNewVideos(channels) : [];

    console.log(`New videos: ${newVideos?.length || 0}, rechecking: ${recheckVideos?.length || 0}`);

    const [newVideosResult, recheckVideosResult] = await getVideoDetails({
      videos: [newVideos, recheckVideos],
      part: 'snippet,statistics,contentDetails,liveStreamingDetails',
      quotaTracker,
    });

    // Add what are probably all new videos
    if (newVideosResult?.length) await upsertVideos(newVideosResult);

    // Update the state of videos that we rechecked (upcoming, live)
    if (recheckVideosResult?.length) await updateVideos(recheckVideosResult);

    // Set updatedAt for all the channels we used in the update
    await updateChannelMany({
      where: { id: { in: map(channels, 'id') } },
      data: { lastCheckedAt: new Date() },
    });

    await checkForDeletedVideos({
      originalVideos: recheckVideos,
      latestVideos: recheckVideosResult,
    });

    if (process.env.NODE_ENV === 'production') {
      const updateHostnames = process.env.UPDATE_HOSTNAMES || 'https://learnbyvideo.dev/api/update';

      for (const updateHostname of updateHostnames.split(',')) {
        await updateHomePage(updateHostname);
      }
    }
  } catch ({ message }) {
    error(`Problem looking for video updates: ${message}`);
  }

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();
