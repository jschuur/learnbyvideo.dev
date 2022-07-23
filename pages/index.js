import { gql } from '@apollo/client';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import serialize from 'serialize-javascript';

import Head from 'next/head';

import { contextResolver } from '../graphql/context';
import { createStaticApolloClient } from '../lib/apollo-client-static';
import defaultGraphQLVariables from '../graphql/defaults';
import { recentVideosQuery, siteDataQuery } from '../graphql/queries';

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
async function loadPageData() {

  const client = createStaticApolloClient(context);
  const {
    data: { recentVideos },
  } = await client.query({
    query: recentVideosQuery,
    variables: defaultGraphQLVariables,
  });
  const {
    data: { videoCount, channelCount },
  } = await client.query({
    query: siteDataQuery,
  });

  return { recentVideos, videoCount, channelCount };
}

export async function getStaticProps() {
  const { recentVideos, videoCount, channelCount } = await loadPageData();

  // via https://dev.to/arianhamdi/react-query-v4-ssr-in-next-js-2ojj
  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery(['recentVideos'], () => recentVideos);

  const lastUpdated = Math.max(...recentVideos.videos.map((v) => new Date(v.updatedAt).getTime()));

  return {
    props: {
      dehydratedState: serialize(dehydrate(queryClient, { shouldDehydrateQuery: () => true })),

      lastUpdated,
      videoCount,
      channelCount,
    },
  };
}
