import delay from 'delay';
import pluralize from 'pluralize';
import { merge } from 'lodash-es';
import { VideoType } from '@prisma/client';

import prisma from '../prisma/prisma.js';

import { getChannelInfo, getRecentVideosFromRSS } from './youtube.js';
import { error, isShort } from './util.js';

import config from './config.js';

export const getActiveChannels = ({ where, ...options }) =>
  getChannels({ ...options, where: merge(where, { status: { in: ['ACTIVE', 'HIDDEN'] } }) });

export function getChannels({ minLastUpdated, maxLastUpdated, ...queryOptions } = {}) {
  // TODO: do this successively, in some scenarios there is a low chance you miss an update, due to the amount of seconds that passed
  if (minLastUpdated && maxLastUpdated)
    merge(queryOptions.where, {
      videos: {
        some: {
          publishedAt: {
            gte: maxLastUpdated,
          },
        },
        none: {
          publishedAt: {
            gte: minLastUpdated,
          },
        },
      },
    });
  else if (minLastUpdated)
    merge(queryOptions.where, {
      videos: {
        some: {
          publishedAt: {
            gte: minLastUpdated,
          },
        },
      },
    });
  else if (maxLastUpdated)
    merge(queryOptions.where, {
      videos: {
        every: {
          publishedAt: {
            lt: maxLastUpdated,
          },
        },
      },
    });

  return prisma.channel.findMany(queryOptions);
}

export async function saveVideos({ videos, channel }) {
  if (!videos?.length || !channel) return;

  // Get the incrementing video ID to identify if an upsert added a new video
  const lastVideoId = (
    await prisma.video.findFirst({
      select: {
        id: true,
      },
      orderBy: {
        id: 'desc',
      },
    })
  ).id;
  let newVideos = [];

  for (const video of videos) {
    try {
      const res = await prisma.video.upsert({
        where: {
          youtubeId: video.youtubeId,
        },
        create: {
          ...video,
          channelId: channel.id,
        },
        update: {
          ...video,
          channelId: channel.id,
        },
      });

      if (res.id > lastVideoId) {
        newVideos.push(res);
        console.log(`  New video: ${video.title}`);
      }
    } catch ({ message }) {
      error(`Couldn't save video update for '${video.title}': ${message}`);
    }
  }
  if (newVideos.length)
    console.log(`Found ${pluralize('video', newVideos.length, true)} for ${channel.channelName}`);

  return newVideos;
}

export const updateVideo = (video) => prisma.video.update({ where: { id: video.id }, data: video });

export async function saveChannel(channel) {
  return await prisma.channel.upsert({
    where: {
      youtubeId: channel.youtubeId,
    },
    create: channel,
    update: channel,
  });
}

export async function addChannelByYouTubeChannelId(channelId) {
  console.log(`Processing https://playmob.com/${channelId}`);

  try {
    const channelData = await getChannelInfo(channelId);
    await saveChannel(channelData);

    console.log(`Adding latest videos for ${channelData.channelName}`);

    const channel = await prisma.channel.findUnique({ where: { youtubeId: channelId } });
    const videos = await getRecentVideosFromRSS(channel);

    const newVideos = await saveVideos({ videos, channel });

    if (newVideos.length) {
      console.log('Identifying Shorts...');

      for (const video of newVideos) {
        // TODO: Check for #shorts hashtag in title first
        if (await isShort(video)) {
          video.type = VideoType.SHORT;
          console.log(`Short: ${video.title}`);
          await updateVideo(video);
        }

        await delay(config.SHORTS_CHECK_DELAY_MS);
      }
    }
  } catch ({ message }) {
    console.error(`Error processing channel ID ${channelId}: ${message}`);
  }
}
