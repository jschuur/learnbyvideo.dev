import pluralize from 'pluralize';

import prisma from './prisma.js';

import { error } from './util.js';

export function getActiveChannels({ minLastUpdated, maxLastUpdated, select } = {}) {
  const query = {
    where: {
      videos: {},
    },
  };

  if (select) where.select = select;

  // TODO: do this succesively, in some scenarios there is a low chance you miss an update, due to the amount of secondd that passed
  if (minLastUpdated && maxLastUpdated)
    query.where = {
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
    };
  else if (minLastUpdated)
    query.where = {
      videos: {
        some: {
          publishedAt: {
            gte: minLastUpdated,
          },
        },
      },
    };
  else if (maxLastUpdated)
    query.where = {
      videos: {
        every: {
          publishedAt: {
            lt: maxLastUpdated,
          },
        },
      },
    };

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
  let newVideos = 0;

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
        newVideos++;
        console.log(`  New video: ${video.title}`);
      }
    } catch ({ message }) {
      error(`Couldn't save video update for '${video.title}': ${message}`);
    }
  }
  if (newVideos)
    console.log(`Found ${pluralize('video', newVideos, true)} for ${channel.channelName}`);
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
