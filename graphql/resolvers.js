import { DateTimeResolver } from 'graphql-scalars';

import { allChannels, channel, channelCount, recentVideos, searchVideos, video, videoCount } from './resolverQueries';

const resolvers = {
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
    channel,
    channelCount,
    allChannels,
    video,
    videoCount,
    recentVideos,
    searchVideos,
  },
};

export default resolvers;
