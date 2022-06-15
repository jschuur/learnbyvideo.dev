import { ChannelStatus, VideoStatus } from '@prisma/client';
import { DateTimeResolver } from 'graphql-scalars';
import PGTsquery from 'pg-tsquery';

const searchTermParser = new PGTsquery.Tsquery();

import config from '../backend/config.mjs';

export const resolvers = {
  DateTime: DateTimeResolver,

  SearchOrderByType: {
    VIEWCOUNT: 'viewCount',
    LIKECOUNT: 'likeCount',
    COMMENTCOUNT: 'commentCount',
    DURATIONSECONDS: 'durationSeconds',
    CREATEDAT: 'createdAt',
    UPDATEDAT: 'updatedAt',
    PUBLISHEDAT: 'publishedAt',
    LANGUAGE: 'language',
    TITLE: 'title',
  },
  SearchOrderDirectionType: {
    ASC: 'asc',
    DESC: 'desc',
  },

  Query: {
    allChannels: (_parent, _args, ctx) =>
      ctx.prisma.channel.findMany({
        where: {
          NOT: {
            status: {
              in: [ChannelStatus.HIDDEN, ChannelStatus.ARCHIVED],
            },
          },
        },
        include: { videos: true, links: true },
      }),
    channel: (_parent, _args, ctx) =>
      ctx.prisma.channel.findUnique({
        where: { id: parseInt(_args.id, 10) },
        include: { videos: true, links: true },
      }),
    recentVideos: (_parent, _args, ctx) =>
      ctx.prisma.video.findMany({
        where: {
          status: {
            in: [VideoStatus.LIVE, VideoStatus.UPCOMING, VideoStatus.PUBLISHED],
          },
          channel: {
            NOT: {
              status: {
                in: [ChannelStatus.HIDDEN, ChannelStatus.ARCHIVED],
              },
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          channel: {
            include: {
              links: true,
            },
          },
        },
        take: Math.trunc(Math.min(_args.count, config.GRAPHQL_MAX_RECENT_VIDEOS)),
      }),
    video: (_parent, _args, ctx) =>
      ctx.prisma.video.findUnique({
        where: { id: parseInt(_args.id, 10) },
        include: { channel: true },
      }),
    videoCount: (_parent, _args, ctx) => ctx.prisma.video.count(),
    channelCount: (_parent, _args, ctx) => ctx.prisma.channel.count(),
    searchVideos: (_parent, _args, ctx) =>
      ctx.prisma.video.findMany({
        where: {
          title: { search: searchTermParser.parseAndStringify(_args.term) },
          type: _args.videoType || undefined,
        },
        orderBy: { [_args.orderBy]: _args.orderDirection },
        include: { channel: { include: { links: true } } },
        take: Math.trunc(Math.min(config.GRAPHQL_MAX_SEARCH_RESULTS_LIMIT, _args.limit)),
        skip: _args.offset,
      }),
  },
};
