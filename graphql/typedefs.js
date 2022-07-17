import { gql } from 'apollo-server-micro';

import config from '../backend/config.mjs';

const typeDefs = gql`
  scalar DateTime

  type Channel {
    id: ID!
    youtubeId: String!
    channelName: String!
    authorName: String
    status: String!
    reviewed: Boolean!
    type: String!
    customUrl: String
    description: String
    country: String
    thumbnail: String!
    thumbnailMedium: String!
    thumbnailHigh: String!
    defaultCategory: String
    defaultLanguage: String
    viewCount: Int
    subscriberCount: Int
    hiddenSubscriberCount: Boolean
    videoCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime!
    lastCheckedAt: DateTime
    lastPublishedAt: DateTime
    crawlState: String

    videos: [Video]!
    links: [ChannelLink]
  }

  type ChannelLink {
    id: ID!
    channelId: Int!
    channel: Channel!
    url: String!
    title: String
    type: String!
  }

  enum VideoType {
    VIDEO
    SHORT
  }

  enum SearchOrderByType {
    VIEWCOUNT
    LIKECOUNT
    COMMENTCOUNT
    DURATIONSECONDS
    CREATEDAT
    UPDATEDAT
    PUBLISHEDAT
    LANGUAGE
    TITLE
  }

  enum SearchOrderDirectionType {
    ASC
    DESC
  }

  type Video {
    id: ID!
    youtubeId: String!
    channel: Channel!
    channelId: Int!
    category: String
    youtubeTags: [String]!
    language: String
    title: String!
    status: String!
    reviewed: Boolean!
    type: String!
    description: String
    duration: String
    durationSeconds: Int!
    viewCount: Int!
    likeCount: Int!
    commentCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime!
    scheduledStartTime: DateTime
    actualStartTime: DateTime
    actualEndTime: DateTime
    sortTime: DateTime
  }

  type Query {
    allChannels: [Channel]
    channel(id: ID): Channel!
    recentVideos(count: Int = ${config.GRAPHQL_DEFAULT_RECENT_VIDEOS_LIMIT}, offset: Int = 0): [Video]!
    video(id: ID): Video
    videoCount: Int!
    channelCount: Int!
    searchVideos(
      term: String,
      offset: Int = 0,
      limit: Int = ${config.GRAPHQL_DEFAULT_SEARCH_RESULTS_LIMIT},
      orderBy: SearchOrderByType = VIEWCOUNT,
      orderDirection: SearchOrderDirectionType = DESC,
      videoType: VideoType): [Video]!
  }
`;

export default typeDefs;
