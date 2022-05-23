import delay from 'delay';
import { map } from 'lodash-es';
import minimost from 'minimost';
import fetch from 'node-fetch';
import pluralize from 'pluralize';

import { getActiveChannels, saveVideos, updateVideo, updateChannel } from './db.mjs';
import { getRecentVideosFromRSS } from './youtube.mjs';

import config from './config.mjs';
import { VideoType } from '@prisma/client';
import { uniq } from 'lodash-es';

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
  let totalNewVideos = 0;
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

    const newVideos = await saveVideos({ videos, channel });
    await updateChannel({ id: channel.id, lastCheckedAt });

    totalNewVideos += newVideos?.length || 0;

    await delay(config.RSS_FEED_UPDATE_DELAY_MS);
  }

  console.log(
    `\nFound ${pluralize('new video', totalNewVideos, true)} across ${channels.length} ${pluralize(
      'channel',
      channels.length,
      false
    )}.`
  );

  // TODO: Only update when there were new videos
  if (process.env.NODE_ENV === 'production') await updateHomePage();
})();
