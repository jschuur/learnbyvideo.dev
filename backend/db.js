import prisma from './prisma.js';

export const getActiveChannels = () => prisma.channel.findMany();

export async function saveVideos({ videos, channel }) {
  // TODO: Show # of new videos
  for (const video of videos) {
    await prisma.video.upsert({
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
  }
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
