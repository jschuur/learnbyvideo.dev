import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Channel {
    id: ID!
    youtubeId: String!
    channelName: String!
    authorName: String
    status: String!
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
    type: String!
    description: String
    duration: String!
    durationSeconds: Int!
    viewCount: Int!
    likeCount: Int!
    commentCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime!
  }

  type Query {
    allChannels: [Channel]
    channel(id: ID): Channel!
    recentVideos(count: Int = 24): [Video]!
    video(id: ID): Video
    videoCount: Int!
    channelCount: Int!
  }
`;
