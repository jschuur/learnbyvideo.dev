import pluralize from 'pluralize';

import prisma from './prisma.js';

import { error } from './util.js';

export const getActiveChannels = () => prisma.channel.findMany();

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
