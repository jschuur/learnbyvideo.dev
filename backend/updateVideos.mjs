import 'dotenv/config';

import delay from 'delay';
import { map, uniq } from 'lodash-es';
import minimost from 'minimost';
import fetch from 'node-fetch';
import pluralize from 'pluralize';

import { getActiveChannels, saveVideos, updateVideo, updateChannel } from './db.mjs';
import { getRecentVideosFromRSS, extractVideoInfo } from './youtube.mjs';
import { youTubeVideosList } from './youtubeApi.mjs';

import config from './config.mjs';
import { VideoType } from '@prisma/client';

const options = minimost(process.argv.slice(2), {
  string: ['min-last-updated', 'max-last-updated'],
  alias: {
    m: 'min-last-updated',
    x: 'max-last-updated',
    l: 'limit',
  },
}).flags;

async function updateHomePage() {
  console.log('Updating production home page');

  try {
    const res = await fetch(
      `http://learnbyvideo.dev/api/update?secret=${process.env.REVALIDATE_SECRET_TOKEN}`
    );

    if (res.ok) {
      console.log(`Cached home page successfully`);
    } else {
      console.error(`Error updating cached home page`);
    }
  } catch ({ message }) {
    console.error(`Error revalidating cached home page: ${message}`);
  }
}

(async () => {
  const { minLastUpdated, maxLastUpdated } = options;
  let allNewVideos = [];
  const lastCheckedAt = new Date();

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
    take: options.limit,
  });

  console.log(`Using ${pluralize('channel', channels.length, true)}`);

  for (const channel of channels) {
    const videos = await getRecentVideosFromRSS(channel);

    if (videos?.length) {
      const newVideos = await saveVideos({ videos, channel });

      allNewVideos.push(...newVideos);
    }

    await updateChannel({ id: channel.id, lastCheckedAt });

    await delay(config.RSS_FEED_UPDATE_DELAY_MS);
  }

  // Get additional details for all the new videos via YouTube API
  if (allNewVideos.length) {
    console.log('Getting new video details...');

    const videoData = await youTubeVideosList({
      part: 'snippet,statistics,contentDetails',
      ids: allNewVideos.map((v) => v.youtubeId),
      task: 'newvideodetails',
    });

    const videos = videoData.map((video) => extractVideoInfo(video));

    for (const video of videos) await updateVideo(video);
  }

  console.log(
    `\nFound ${pluralize('new video', allNewVideos.length, true)} across ${
      channels.length
    } ${pluralize('channel', channels.length, false)}.`
  );

  if (process.env.NODE_ENV === 'production' && allNewVideos.length) await updateHomePage();
})();
