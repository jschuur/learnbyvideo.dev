import delay from 'delay';
import { map } from 'lodash-es';
import minimost from 'minimost';
import pc from 'picocolors';
import pluralize from 'pluralize';
import { VideoStatus, CrawlState } from '@prisma/client';

const options = minimost(process.argv.slice(2), {
  string: ['max-channels'],
  alias: {
    c: 'max-channels',
  },
}).flags;

import {
  getActiveChannels,
  getChannel,
  getChannels,
  saveVideos,
  todaysQuotaUsage,
  updateChannel,
} from './db.mjs';
import { youTubePlaylistItems, currentQuotaUsage, youTubeVideosList } from './youtubeApi.mjs';
import { extractVideoInfo, uploadPlaylistIdFromChannelId } from './youtube.mjs';
import { error } from './util.mjs';

import config from './config.mjs';

async function quotaWarning(belowLimitText) {
  const quotaUsage = await todaysQuotaUsage('crawler');

  if (quotaUsage > config.MAX_CRAWLER_DAILY_QUOTA) {
    console.log(
      `${pc.yellow('Warning:')} Exceeded daily quota limit for crawler: ${quotaUsage} > ${
        config.MAX_CRAWLER_DAILY_QUOTA
      }. Exiting.`
    );

    process.exit(1);
  } else
    console.log(
      `Daily quota usage at ${pluralize('point', quotaUsage, true)} (${
        config.MAX_CRAWLER_DAILY_QUOTA
      } max)`
    );
}

(async () => {
  let crawlState;

  await quotaWarning();

  const channels = await getChannels({
    where: { crawlState: CrawlState.PENDING },
    take: options.maxChannels ? parseInt(options.maxChannels) : undefined,
  });

  console.log(`Crawling ${pluralize('channel', channels.length, true)}...`);

  for (const channel of channels) {
    try {
      const videoIds = map(
        await youTubePlaylistItems({
          playlistId: uploadPlaylistIdFromChannelId(channel.youtubeId),
          part: 'contentDetails',
          task: 'crawler',
        }),
        (v) => v.contentDetails.videoId
      );

      if (videoIds?.length) {
        console.log(`Retrieved ${videoIds.length} videos for ${channel.channelName}`);

        const videoData = await youTubeVideosList({
          part: 'snippet,statistics,contentDetails',
          ids: videoIds,
          task: 'crawler',
        });

        const videos = videoData.map((video) => extractVideoInfo(video));

        await saveVideos({ channel, videos });
      } else {
        console.warn(`Skipping ${channel.channelName}, no video`);
      }

      console.log(`Crawling completed for ${channel.channelName}`);

      crawlState = CrawlState.COMPLETED;
    } catch ({ message }) {
      crawlState = CrawlState.ERROR;

      error(message);
    }

    await updateChannel({ id: channel.id, crawlState });

    await quotaWarning();
  }

  console.log(`Quota usage: ${currentQuotaUsage()}`);
})();
