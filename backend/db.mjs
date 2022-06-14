import delay from 'delay';
import pluralize from 'pluralize';
import { merge, differenceBy, map, groupBy, omit } from 'lodash-es';
import { VideoType, VideoStatus, CrawlState } from '@prisma/client';

import prisma from '../prisma/prisma.mjs';
import { extractChannelInfo, videoStatus, isShort, crawlChannel } from './youtube.mjs';
import { youTubeChannelsList } from './youtubeApi.mjs';
import { youtubeQuotaDate } from './youtube.mjs';
import { error } from './util.mjs';

import config from './config.mjs';

export const getMonitoredChannels = ({ where = {}, ...options } = {}) =>
  getChannels({
    ...options,
    where: merge(where, { status: { in: ['ACTIVE', 'HIDDEN', 'MODERATED'] } }),
    orderBy: { lastPublishedAt: 'desc' },
  });

export const getChannels = (queryOptions) => prisma.channel.findMany(queryOptions);
export const getChannel = (queryOptions) => prisma.channel.findUnique(queryOptions);

export const getVideos = (queryOptions) => prisma.video.findMany(queryOptions);

export async function upsertVideos(videos) {
  const newVideos = [];

  if (!videos?.length) return;

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

  // Process videos grouped by channel
  for (const channelVideos of Object.values(groupBy(videos, (v) => v.channel.youtubeId))) {
    const { channel } = channelVideos[0];

    console.log(`Saving videos for ${channel.channelName}...`);

    for (const video of channelVideos) {
      try {
        delete video.channel;

        const newVideo = await prisma.video.upsert({
          where: {
            youtubeId: video.youtubeId,
          },
          create: {
            ...video,
            category: video.category || channel.defaultCategory || undefined,
            status: video.status || videoStatus({ channel, video }),
            language: video.language || channel.defaultLanguage || undefined,
            channelId: video.chanelId || channel.id,
          },
          update: {
            ...video,
            channelId: video.channelId || channel.id,
          },
        });

        if (newVideo.id > lastVideoId) {
          console.log(`  New video: ${channel.channelName}: ${video.title}`);

          newVideos.push(newVideo);

          // Look for YouTube Shorts
          if (await isShort(video)) {
            console.log('  ...is Short');

            video.type = VideoType.SHORT;
            await Promise.allSettled([delay(config.SHORTS_CHECK_DELAY_MS), updateVideo(video)]);
          }
        }
      } catch ({ message }) {
        error(`Couldn't save video update for '${video.title}': ${message}`);
      }

      await updateLastPublishedAt(channel);
    }
  }

  return newVideos;
}

// Update the latestPublishedAt date for the channel
export async function updateLastPublishedAt(channel) {
  const latestVideo = await prisma.video.findFirst({
    where: {
      channelId: channel.id,
      NOT: {
        status: {
          in: [VideoStatus.DELETED, VideoStatus.HIDDEN, VideoStatus.MODERATED],
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  if (latestVideo)
    await updateChannel({ id: channel.id, lastPublishedAt: latestVideo.publishedAt });
}

// Database check for which youtubeIds are new videos
export async function removeKnownVideos(videos) {
  const existingVideos = await prisma.video.findMany({
    where: {
      youtubeId: {
        in: map(videos, 'youtubeId'),
      },
    },
    select: {
      id: true,
      youtubeId: true,
    },
  });

  if (!existingVideos.length) return videos;

  return differenceBy(videos, existingVideos, 'youtubeId');
}

export const updateVideo = (video) =>
  prisma.video.update({
    where: { youtubeId: video.youtubeId },
    data: video,
  });

export function updateVideos(videos) {
  if (!videos?.length) return;

  return Promise.all(
    videos.map((video) =>
      prisma.video.update({
        where: {
          youtubeId: video.youtubeId,
        },
        data: omit(video, 'channel'),
      })
    )
  );
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

export async function addChannel({ data, lastCheckedAt, quotaTracker, crawlVideos }) {
  const { youtubeId, ...customChannelData } = data;
  let channel;

  console.log(`Processing https://youtube.com/channel/${youtubeId}`);

  try {
    const channelData = await youTubeChannelsList({
      ids: [youtubeId],
      part: 'snippet,statistics',
      quotaTracker,
    });

    if (!channelData?.length) throw Error(`Invalid channel ID`);

    channel = await saveChannel({ ...extractChannelInfo(channelData[0]), ...customChannelData });

    console.log(`Adding videos for ${channel.channelName}`);

    if (crawlVideos) {
      const videos = await crawlChannel({ channel, quotaTracker });

      if (videos?.length) await upsertVideos(videos);
      else console.log(`No videos found for ${channel.channelName}`);

      channel = await updateChannel({
        id: channel.id,
        lastCheckedAt,
        crawlState: CrawlState.COMPLETED,
      });

      return channel;
    } else console.log(`Skipping video crawl for ${channel.channelName}`);
  } catch (error) {
    if (channel && crawlVideos)
      await updateChannel({ id: channel.id, lastCheckedAt, crawlState: CrawlState.ERROR });

    throw error;
  }
}

export const updateChannel = (channel) =>
  prisma.channel.update({ where: { id: channel.id }, data: channel });

export const updateChannels = (channels = []) =>
  Promise.all(
    channels.map((channel) =>
      prisma.channel.update({
        where: {
          youtubeId: channel.youtubeId,
        },
        data: channel,
      })
    )
  );

export const addQuotaUsage = ({ endpoint, ...rest }) =>
  prisma.quotaUsage.create({
    data: {
      date: youtubeQuotaDate(),
      endpoint: endpoint.toUpperCase().replace('.', ''),
      ...rest,
    },
  });

export async function todaysQuotaUsage(task) {
  const where = { date: { startsWith: youtubeQuotaDate().split(' ')[0] } };

  if (task) where.task = task;

  const quotaUsage = await prisma.quotaUsage.aggregate({
    _sum: {
      points: true,
    },
    where,
  });

  return quotaUsage._sum.points || 0;
}
