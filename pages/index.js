import { gql } from '@apollo/client';
import Head from 'next/head';

import { contextResolver } from '../graphql/context';
import { createStaticApolloClient } from '../lib/apollo-client-static';

import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import VideoGrid from '../components/VideoGrid';

export default function HomePage({ videos, videoCount, channelCount, lastUpdated }) {
  return (
    <div className="container mx-auto px-10">
      <Head>
        <title>LearnByVideo.dev - Find the best web development tutorial videos</title>
      </Head>
      <Header />
      <VideoGrid videos={videos} />
      <Footer videoCount={videoCount} channelCount={channelCount} lastUpdated={lastUpdated} />
    </div>
  );
}

export async function getStaticProps(context) {
  await contextResolver(context);

  const client = createStaticApolloClient(context);
  const response = await client.query({
    query: gql`
      query Query {
        recentVideos(limit: ${process.env.NEXT_PUBLIC_VIDEO_GRID_COUNT || 120}) {
          title
          status
          youtubeId
          updatedAt
          publishedAt
          scheduledStartTime
          actualStartTime
          createdAt
          duration
          type
          channel {
            channelName
            type
          }
        }
        videoCount
        channelCount
      }
    `,
  });

  const { recentVideos } = response.data;
  const lastUpdated = Math.max(...recentVideos.map((v) => new Date(v.updatedAt).getTime()));

  return {
    props: {
      videos: JSON.parse(JSON.stringify(recentVideos)),
      lastUpdated,
      videoCount: response.data.videoCount,
      channelCount: response.data.channelCount,
    },
  };
}
