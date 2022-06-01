import 'dotenv/config';
import { map } from 'lodash-es';
import pluralize from 'pluralize';
import prettyMilliseconds from 'pretty-ms';

import delay from 'delay';

import { getChannels, updateChannels } from './db.mjs';
import { youTubeChannelsList } from './youtubeApi.mjs';
import { extractChannelInfo } from './youtube.mjs';

(async () => {
  const startTime = Date.now();
  const channels = await getChannels();

  console.log(`Updating ${pluralize('channel', channels.length, true)}`);

  const channelData = await youTubeChannelsList({
    ids: map(channels, 'youtubeId'),
    part: 'snippet,statistics',
  });

  const results = await updateChannels(channelData.map((channel) => extractChannelInfo(channel)));

  const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Memory used: ~${Math.round(heapUsed * 100) / 100} MB`);
  console.log(`Run time: ${prettyMilliseconds(Date.now() - startTime)}`);
})();
