import { gql } from '@apollo/client';
import Head from 'next/head';

import { contextResolver } from '../graphql/context.js';
import { createStaticApolloClient } from '../lib/apollo-client-static.js';

import Footer from '../components/layout/Footer.js';
import Header from '../components/layout/Header.js';
import VideoGrid from '../components/VideoGrid.js';

export default function HomePage({ videos, videoCount, channelCount, lastUpdated }) {
  return (
    <div className='container mx-auto px-10'>
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
        recentVideos(count: ${process.env.NEXT_PUBLIC_VIDEO_GRID_COUNT || 96}) {
          title
          status
          youtubeId
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

  return {
    props: {
      videos: JSON.parse(JSON.stringify(response.data.recentVideos)),
      lastUpdated: new Date().toLocaleString(),
      videoCount: response.data.videoCount,
      channelCount: response.data.channelCount,
    },
  };
}
