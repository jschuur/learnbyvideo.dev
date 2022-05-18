import delay from 'delay';
import pluralize from 'pluralize';
import { merge } from 'lodash-es';
import { VideoType, ChannelStatus, VideoStatus } from '@prisma/client';

import prisma from '../prisma/prisma.js';

import { getChannelInfo, getRecentVideosFromRSS, videoStatus } from './youtube.js';
import { error } from './util.js';
import { isShort } from './youtube.js';

import config from './config.js';

export const getActiveChannels = ({ where = {}, ...options } = {}) =>
  getChannels({
    ...options,
    where: merge(where, { status: { in: ['ACTIVE', 'HIDDEN'] } }),
    orderBy: { lastPublishedAt: 'desc' },
  });

export const getChannels = (queryOptions) => prisma.channel.findMany(queryOptions);

export async function saveVideos({ videos, channel, skipShortDetection = false }) {
  let newVideos = [];

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

  for (const video of videos) {
    try {
      const newVideo = await prisma.video.upsert({
        where: {
          youtubeId: video.youtubeId,
        },
        create: {
          ...video,
          category: channel.defaultCategory || undefined,
          status: videoStatus({ channel, video }),
          language: channel.defaultLanguage || undefined,
          channelId: channel.id,
        },
        update: {
          ...video,
          channelId: channel.id,
        },
      });

      if (newVideo.id > lastVideoId) {
        newVideos.push(newVideo);

        console.log(`  New video: ${video.title}`);

        // Look for YouTube Shorts
        if (!skipShortDetection && (await isShort(video))) {
          console.log('  ...is Short');

          video.type = VideoType.SHORT;
          await Promise.allSettled([delay(config.SHORTS_CHECK_DELAY_MS), updateVideo(video)]);
        }
      }
    } catch ({ message }) {
      error(`Couldn't save video update for '${video.title}': ${message}`);
    }
  }

  if (newVideos.length) {
    // Update the latestPublishedAt date for the channel
    const latestVideo = await prisma.video.findFirst({
      where: {
        channelId: channel.id,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    await updateChannel({ id: latestVideo.channelId, lastPublishedAt: latestVideo.publishedAt });

    console.log(`Found ${pluralize('video', newVideos.length, true)} for ${channel.channelName}`);
  }

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

export async function addChannelByYouTubeChannelId({ youtubeId, lastCheckedAt }) {
  console.log(`Processing https://youtube.com/${youtubeId}`);

  try {
    const channelData = await getChannelInfo(youtubeId);
    let channel = await saveChannel(channelData);

    console.log(`Adding latest videos for ${channel.channelName}`);

    const videos = await getRecentVideosFromRSS(channel);
    await saveVideos({ videos, channel });

    if (lastCheckedAt) {
      channel.lastCheckedAt = lastCheckedAt;

      channel = await updateChannel({ id: channel.id, lastCheckedAt });
    }

    return channel;
  } catch ({ message }) {
    console.error(`Error processing channel ID ${youtubeId}: ${message}`);
  }
}

export const updateChannel = (channel) =>
  prisma.channel.update({ where: { id: channel.id }, data: channel });
