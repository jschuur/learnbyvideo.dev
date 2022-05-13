import { DateTimeResolver, JSONObjectResolver } from 'graphql-scalars';
import { VideoStatus, ChannelStatus } from '@prisma/client';

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONObjectResolver,

  Query: {
    allChannels: (_parent, _args, ctx) => ctx.prisma.channel.findMany(),
    channel: (_parent, _args, ctx) =>
      ctx.prisma.channel.findUnique({
        where: { id: parseInt(_args.id, 10) },
        include: { videos: true },
      }),
    recentVideos: (_parent, _args, ctx) =>
      ctx.prisma.video.findMany({
        where: {
          status: {
            in: [VideoStatus.LIVE, VideoStatus.PUBLISHED],
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
          channel: true,
        },
        take: 24,
      }),
    video: (_parent, _args, ctx) =>
      ctx.prisma.video.findUnique({
        where: { id: parseInt(_args.id, 10) },
        include: { channel: true },
      }),
  },
};
