import 'dotenv/config';

import { map } from 'lodash-es';
import pluralize from 'pluralize';

import { getChannels, updateChannels } from './db.mjs';
import { logMemoryUsage, logTimeSpent } from './util.mjs';
import { extractChannelInfo } from './youtube.mjs';
import { youTubeChannelsList } from './youtubeApi.mjs';
import QuotaTracker from './youtubeQuota.mjs';

(async () => {
  const startTime = Date.now();
  const quotaTracker = new QuotaTracker({ task: 'update_channels' });

  console.log('Starting update:channels');
  await quotaTracker.checkUsage();

  await quotaTracker.showSummary();
  console.log();

  const channels = await getChannels();

  console.log(`Updating ${pluralize('channel', channels.length, true)}`);

  const channelData = await youTubeChannelsList({
    ids: map(channels, 'youtubeId'),
    part: 'snippet,statistics',
    quotaTracker,
  });

  await updateChannels(channelData.map((channel) => extractChannelInfo(channel)));

  console.log();
  await quotaTracker.showSummary();

  logTimeSpent(startTime);
  logMemoryUsage();
})();
