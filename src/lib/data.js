'use server';

import 'server-only';

import { ChannelStatus, VideoStatus } from '@prisma/client';

import config from '@/backend/config.mjs';
import prisma from '@/prisma/prisma.mjs';

export const getChannelCount = async () => prisma.channel.count();
export const getVideoCount = async () => prisma.video.count();

export const getSiteData = async () => {
  const [channelCount, videoCount] = await Promise.all([getChannelCount(), getVideoCount()]);

  return {
    channelCount,
    videoCount,
  };
};

export async function getRecentVideos({
  offset = 0,
  limit = config.NEXT_PUBLIC_VIDEO_GRID_COUNT,
} = {}) {
  const take = Math.min(limit, config.GRAPHQL_MAX_RECENT_VIDEOS);

  const query = {
    where: {
      channel: {
        NOT: {
          status: {
            in: [ChannelStatus.HIDDEN, ChannelStatus.ARCHIVED],
          },
        },
      },
      status: {
        in: [VideoStatus.UPCOMING, VideoStatus.LIVE, VideoStatus.PUBLISHED],
      },
    },
    include: {
      channel: {
        include: {
          links: true,
        },
      },
    },
    orderBy: {
      sortTime: 'desc',
    },
    skip: offset,
    take,
  };

  const videos = await prisma.video.findMany(query);

  return {
    videos,
    pageInfo: {
      count: videos.length,
      nextOffset: offset + take,
    },
  };
}
