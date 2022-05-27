import 'dotenv/config';
import { map } from 'lodash-es';
import pluralize from 'pluralize';

import delay from 'delay';

import { getChannels, updateChannels } from './db.mjs';
import { youTubeChannelsList } from './youtubeApi.mjs';
import { extractChannelInfo } from './youtube.mjs';

(async () => {
  const channels = await getChannels();

  console.log(`Updating ${pluralize('channel', channels.length, true)}`);

  const channelData = await youTubeChannelsList({
    ids: map(channels, 'youtubeId'),
    part: 'snippet,statistics',
  });

  const results = await updateChannels(channelData.map((channel) => extractChannelInfo(channel)));

  console.log(results.length);
  console.log(JSON.stringify(results[0], null, 2));

  // console.log(
  //   `\nFound ${pluralize('new video', totalNewVideos, true)} across ${channels.length} ${pluralize(
  //     'channel',
  //     channels.length,
  //     false
  //   )}.`
  // );
})();