import { ApolloServer, gql, makeExecutableSchema } from 'apollo-server-micro';

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
    id: ID
    youtubeId: String
    channelName: String
    status: String
    type: String
    customUrl: String
    description: String
    country: String
    thumbnail: String
    thumbnailMedium: String
    thumbnailHigh: String
    statistics: Statistics
    createdAt: DateTime
    updatedAt: DateTime
    publishedAt: DateTime
    videos: [Video]!
  }

  type Video {
    id: Int
    youtubeId: String
    channelId: Int
    channel: Channel
    title: String
    status: String
    type: String
    description: String
    thumbnail: String
    views: Int
    starRating: JSON
    createdAt: DateTime
    updatedAt: DateTime
    publishedAt: DateTime
  }

  type Query {
    allChannels: [Channel]
    channel(id: ID): Channel!
    recentVideos: [Video]!
    video(id: ID): Video
  }
`;
