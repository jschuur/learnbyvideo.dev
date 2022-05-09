import delay from 'delay';
import minimost from 'minimost';
import pluralize from 'pluralize';

import { getActiveChannels, saveVideos } from './db.js';
import { getRecentVideosFromRSS } from './lib.js';

import config from './config.js';

const options = minimost(process.argv.slice(2), {
  string: ['min-last-updated', 'max-last-updated'],
  alias: {
    m: 'min-last-updated',
    x: 'max-last-updated',
  },
}).flags;

(async () => {
  const { minLastUpdated, maxLastUpdated } = options;
  let totalNewVideos = 0;

  console.log(`Looking for new videos... (${JSON.stringify({ minLastUpdated, maxLastUpdated })})`);

  const channels = await getActiveChannels({
    minLastUpdated: minLastUpdated
      ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(options.minLastUpdated, 10))
      : undefined,
    maxLastUpdated: maxLastUpdated
      ? new Date(Date.now() - 1000 * 60 * 60 * 24 * parseInt(options.maxLastUpdated, 10))
      : undefined,
  });

  console.log(`Using ${pluralize('channel', channels.length, false)}`);

  for (const channel of channels) {
    const videos = await getRecentVideosFromRSS(channel);

    const newVideos = await saveVideos({ videos, channel });
    totalNewVideos += newVideos.length;

    await delay(config.RSS_FEED_UPDATE_DELAY_MS);
  }

  console.log(
    `\nFound ${pluralize('new video', totalNewVideos, true)} across ${channels.length} ${pluralize(
      'channel',
      channels.length,
      false
    )}.`
  );
})();
