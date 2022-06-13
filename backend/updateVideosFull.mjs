import 'dotenv/config';

import delay from 'delay';
import { differenceBy } from 'lodash-es';
import minimost from 'minimost';
import pluralize from 'pluralize';
import { VideoStatus } from '@prisma/client';

import { getVideos, updateVideo, updateVideos } from './db.mjs';
import { getVideoDetails, missingVideoStatus, videoUrl } from './youtube.mjs';
import { QuotaTracker } from './youtubeQuota.mjs';
import { logTimeSpent, logMemoryUsage, debug } from './util.mjs';

import config from './config.mjs';

const options = minimost(process.argv.slice(2), {
  string: ['limit', 'offset', 'ids', 'min-last-published', 'order-by'],
  boolean: ['force', 'all-statuses'],
  default: { 'order-by': 'updated' },
  alias: {
    l: 'limit',
    m: 'min-last-published',
    o: 'offset',
    i: 'ids',
    b: 'order-by',
    f: 'force',
    a: 'all-statuses',
  },
}).flags;

async function analyseMissingVideos(videos) {
  for (const video of videos) {
    const status = await missingVideoStatus(video.youtubeId);
    console.log(`${status}: ${video.youtubeId}`);

    await delay(config.MISSING_VIDEO_STATUS_CHECK_DELAY_MS);
  }
}

function getVideosForUpdate({ minLastPublished, orderBy, allStatuses, ids, limit, offset }) {
  const queryOptions = {
    where: {},
    select: {
      title: true,
      youtubeId: true,
      status: true,
      channel: true,
    },
    take: limit ? parseInt(limit, 10) : undefined,
    skip: offset ? parseInt(offset, 10) : undefined,
  };

  if (!allStatuses)
    queryOptions.where.NOT = {
      status: {
        in: [VideoStatus.HIDDEN, VideoStatus.PRIVATE, VideoStatus.DELETED],
      },
    };

  if (minLastPublished) {
    queryOptions.where.publishedAt = {
      gte: minLastPublished
        ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(minLastPublished, 10))
        : new Date(0),
    };
  } else if (ids) {
    queryOptions.where.youtubeId = { in: ids.split(',') };
  }

  if (orderBy === 'updated') {
    queryOptions.orderBy = { updatedAt: 'asc' };
  } else {
    queryOptions.orderBy = { publishedAt: 'desc' };
  }

  debug(JSON.stringify(queryOptions, null, 2));

  console.log('Loading videos to update from database...');

  return getVideos(queryOptions);
}

(async () => {
  const { force } = options;
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'update_videos_full', force });

  try {
    console.log('Starting update:videos');
    await quotaTracker.checkUsage();

    await quotaTracker.showSummary();
    console.log();

    const videos = await getVideosForUpdate(options);
    const videoUpdates = await getVideoDetails({
      videos,
      part: 'snippet,statistics,contentDetails,liveStreamingDetails',
      quotaTracker,
    });

    console.log(`Updating ${pluralize('video', videoUpdates.length, true)} in the database...`);
    await updateVideos(videoUpdates);

    const deletedVideos = differenceBy(videos, videoUpdates, 'youtubeId');

    console.log(
      `Identified ${pluralize(
        'video',
        deletedVideos.length,
        true
      )} that appear to have been deleted: ${deletedVideos
        .map((video) => video.youtubeId)
        .join(', ')}`
    );
    for (const video of deletedVideos) {
      const { youtubeId } = video;

      const deletedStatus = await missingVideoStatus(youtubeId);

      console.log(`${status}: ${videoUrl(videoId)}`);

      if (['REMOVED', 'UNAVAILABLE', 'DELETED_ACCOUNT'].includes(deletedStatus)) {
        updateVideo({ ...video, status: VideoStatus.DELETED });
      } else if (deletedStatus === 'PRIVATE')
        updateVideo({ ...video, status: VideoStatus.PRIVATE });
    }
  } catch ({ message }) {
    error(message);
  }

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();
