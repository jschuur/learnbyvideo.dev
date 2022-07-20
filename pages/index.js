import { gql } from '@apollo/client';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import serialize from 'serialize-javascript';

import Head from 'next/head';

import { contextResolver } from '../graphql/context';
import { createStaticApolloClient } from '../lib/apollo-client-static';

import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import VideoGrid from '../components/VideoGrid';

export default function HomePage({ videoCount, channelCount, lastUpdated }) {
  return (
    <div className="container mx-auto px-10">
      <Head>
        <title>LearnByVideo.dev - Find the best web development tutorial videos</title>
      </Head>
      <Header />
      <VideoGrid />
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
          videos {
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
          pageInfo {
            nextOffset
          }
        }
        videoCount
        channelCount
      }
    `,
  });

  const { recentVideos } = response.data;

  // via https://dev.to/arianhamdi/react-query-v4-ssr-in-next-js-2ojj
  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery(['recentVideos'], () => recentVideos);

  const lastUpdated = Math.max(...recentVideos.videos.map((v) => new Date(v.updatedAt).getTime()));

  return {
    props: {
      dehydratedState: serialize(dehydrate(queryClient, { shouldDehydrateQuery: () => true })),

      lastUpdated,
      videoCount: response.data.videoCount,
      channelCount: response.data.channelCount,
    },
  };
}
