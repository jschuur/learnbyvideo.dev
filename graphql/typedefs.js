import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Statistics {
    viewCount: Int
    videoCount: Int
    subscriberCount: Int
    hiddenSubscriberCount: Boolean
  }

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
    statistics: Statistics!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime!
    lastCheckedAt: DateTime
    lastPublishedAt: DateTime

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
    language: String
    title: String!
    status: String!
    type: String!
    description: String
    thumbnail: String!
    views: Int!
    starRating: JSON!
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
