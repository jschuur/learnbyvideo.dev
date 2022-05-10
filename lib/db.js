import pluralize from 'pluralize';
import { merge } from 'lodash-es';

import prisma from './prisma.js';

import { error } from '../backend/util.js';

export const getActiveChannels = (options) =>
  getChannels({ ...options, where: { status: { in: ['ACTIVE', 'HIDDEN'] } } });

export function getChannels({ minLastUpdated, maxLastUpdated, select, where } = {}) {
  const query = {
    where,
    select,
  };

  if (select) where.select = select;

  // TODO: do this successively, in some scenarios there is a low chance you miss an update, due to the amount of secondd that passed
  if (minLastUpdated && maxLastUpdated)
    merge(query.where, {
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
    merge(query.where, {
      videos: {
        some: {
          publishedAt: {
            gte: minLastUpdated,
          },
        },
      },
    });
  else if (maxLastUpdated)
    merge(query.where, {
      videos: {
        every: {
          publishedAt: {
            lt: maxLastUpdated,
          },
        },
      },
    });

  return prisma.channel.findMany(query);
}

export async function saveVideos({ videos, channel }) {
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

export async function saveChannel(channel) {
  return await prisma.channel.upsert({
    where: {
      youtubeId: channel.youtubeId,
    },
    create: channel,
    update: channel,
  });
}

export const getRecentVideos = async ({ limit = 24 } = {}) =>
  // TODO: include channel info in the response
  prisma.video.findMany({
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
