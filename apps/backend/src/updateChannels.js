import 'dotenv-mono/load';

import { map } from 'lodash-es';
import pluralize from 'pluralize';

import { getChannels, updateChannels } from './db.js';
import { logMemoryUsage, logTimeSpent } from './util.js';
import { extractChannelInfo } from './youtube.js';
import { youTubeChannelsList } from './youtubeApi.js';
import QuotaTracker from './youtubeQuota.js';

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
