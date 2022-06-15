import 'dotenv/config';

import delay from 'delay';
import minimost from 'minimost';
import pluralize from 'pluralize';

import { VideoStatus } from '@prisma/client';

import {
  getMonitoredChannels,
  getVideos,
  removeKnownVideos,
  updateChannel,
  updateVideos,
  upsertVideos,
} from './db.mjs';
import { updateHomePage } from './lib.mjs';
import { error, logMemoryUsage, logTimeSpent, warn } from './util.mjs';
import { getRecentVideosFromRSS, getVideoDetails } from './youtube.mjs';
import { QuotaTracker } from './youtubeQuota.mjs';

import config from './config.mjs';

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

async function getChannelsForUpdate({ minLastUpdated, maxLastUpdated, limit }) {
  console.log(`Looking for new videos... (${JSON.stringify({ minLastUpdated, maxLastUpdated })})`);

  const channels = await getMonitoredChannels({
    where: options.channels
      ? { youtubeId: { in: options.channels.split(',') } }
      : {
          OR: [
            {
              lastPublishedAt: {
                gte: minLastUpdated
                  ? new Date(
                      Date.now() - 1000 * 60 * 60 * 24 * parseInt(options.minLastUpdated, 10)
                    )
                  : new Date(0),
                lt: maxLastUpdated
                  ? new Date(
                      Date.now() - 1000 * 60 * 60 * 24 * parseInt(options.maxLastUpdated, 10)
                    )
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

  console.log(`Using ${pluralize('channel', channels.length, true)}`);

  return channels;
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

    // TODO use the API if a channel has 15 new videos
    if (newVideos?.length === 15)
      warn(`RSS feed for ${channel.channelName} has 15 new videos, check API for more`);

    // Don't spam the feed URLs
    await delay(config.RSS_FEED_UPDATE_DELAY_MS);
  }

  return allNewVideos;
}

// Find upcoming Premiers and live videos to check for potential status changes
async function findRecheckVideos() {
  // TODO: Only recheck videos from the last 31 days
  const videos = await getVideos({
    where: {
      OR: [
        {
          status: { in: [VideoStatus.UPCOMING, VideoStatus.LIVE] },
        },
        {
          scheduledStartTime: { not: null },
          actualStartTime: null,
        },
      ],
    },
    include: {
      channel: true,
    },
  });

  if (videos?.length) {
    console.log(
      `Checking for status change of ${pluralize('upcoming/live video', videos.length, true)}`
    );
  }

  return videos;
}

(async () => {
  const { force } = options;
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'update_videos', force });

  console.log('Starting update:videos');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  try {
    const channels = options.findNewVideos ? await getChannelsForUpdate(options) : [];
    const newVideos = options.findNewVideos ? await findNewVideos(channels) : [];
    const recheckVideos = options.recheckVideos ? await findRecheckVideos() : [];

    // SPRINT: Also recheck videos from the last X hours/days to see if they have been deleted (do another deleted video check for older videos in a separate script)

    const [newVideosResult, recheckVideosResult] = await getVideoDetails({
      videos: [newVideos, recheckVideos],
      part: 'snippet,statistics,contentDetails,liveStreamingDetails',
      quotaTracker,
    });

    // Add what are probably all new videos
    if (newVideosResult?.length) {
      const addedVideos = await upsertVideos(newVideosResult);

      console.log(`\nAdded ${pluralize('new video', addedVideos.length, true)} in total`);
    }

    // Update the state of videos that we rechecked (upcoming, live)
    if (recheckVideosResult?.length) await updateVideos(recheckVideosResult);

    for (const channel of channels) await updateChannel(channel);

    if (process.env.NODE_ENV === 'production') await updateHomePage();
  } catch ({ message }) {
    error(`Problem looking for video updates: ${message}`);
  }

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();
