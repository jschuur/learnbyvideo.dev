import { ChannelStatus, VideoStatus } from '@prisma/client';
import { merge, sortBy } from 'lodash-es';
import PGTsquery from 'pg-tsquery';

import config from '../backend/config.mjs';

const searchTermParser = new PGTsquery.Tsquery();

export const channel = (_parent, _args, ctx) =>
  ctx.prisma.channel.findUnique({
    where: { id: parseInt(_args.id, 10) },
    include: { links: true },
  });

export const allChannels = (_parent, _args, ctx) =>
  ctx.prisma.channel.findMany({
    where: {
      NOT: {
        status: {
          in: [ChannelStatus.HIDDEN, ChannelStatus.ARCHIVED],
        },
      },
    },
    include: { links: true },
  });

export const channelCount = (_parent, _args, ctx) => ctx.prisma.channel.count();

export const video = (_parent, _args, ctx) =>
  ctx.prisma.video.findUnique({
    where: { id: parseInt(_args.id, 10) },
    include: { channel: true },
  });

export const videoCount = (_parent, _args, ctx) => ctx.prisma.video.count();

export async function recentVideos(_parent, _args, ctx) {
  const count = Math.min(_args.count, config.GRAPHQL_MAX_RECENT_VIDEOS);

  const sharedOptions = {
    where: {
      channel: {
        NOT: {
          status: {
            in: [ChannelStatus.HIDDEN, ChannelStatus.ARCHIVED],
          },
        },
      },
    },
    include: {
      channel: {
        include: {
          links: true,
        },
      },
    },
    take: count,
  };

  const [recent, live] = await Promise.all([
    ctx.prisma.video.findMany(
      merge({}, sharedOptions, {
        where: {
          status: {
            in: [VideoStatus.LIVE, VideoStatus.UPCOMING, VideoStatus.PUBLISHED],
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
      })
    ),
    ctx.prisma.video.findMany(
      merge({}, sharedOptions, {
        where: {
          status: {
            in: [VideoStatus.LIVE],
          },
        },
        orderBy: {
          actualStartTime: 'desc',
        },
      })
    ),
  ]);

  // Merge in the live videos based on their actual start time sorted among other videos' published time
  return sortBy([...recent, ...live], (v) => v.actualStartTime || v.publishedAt)
    .reverse()
    .slice(0, count);
}

export const searchVideos = (_parent, _args, ctx) =>
  ctx.prisma.video.findMany({
    where: {
      title: { search: searchTermParser.parseAndStringify(_args.term) },
      type: _args.videoType || undefined,
    },
    orderBy: { [_args.orderBy]: _args.orderDirection },
    include: { channel: { include: { links: true } } },
    take: Math.trunc(Math.min(config.GRAPHQL_MAX_SEARCH_RESULTS_LIMIT, _args.limit)),
    skip: _args.offset,
  });
