import { QueryClient, dehydrate } from '@tanstack/react-query';

import Head from 'next/head';

import defaultGraphQLVariables from '../graphql/defaults';
import { recentVideosQuery, siteDataQuery } from '../graphql/queries';
import createLocalApolloClient from '../lib/apolloClient';

import VideoGrid from '../components/VideoGrid';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

export default function HomePage({ videoCount, channelCount, lastUpdated }) {
  return (
    <div className='container px-10 mx-auto'>
      <Head>
        <title>LearnByVideo.dev - Find the best web development tutorial videos</title>
      </Head>
      <Header />
      <VideoGrid />
      <Footer videoCount={videoCount} channelCount={channelCount} lastUpdated={lastUpdated} />
    </div>
  );
}

async function loadPageData() {
  const client = createLocalApolloClient();

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
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['recentVideos'],
    queryFn: () => recentVideos,
  });

  const lastUpdated = Math.max(...recentVideos.videos.map((v) => new Date(v.updatedAt).getTime()));
  const dehydratedState = dehydrate(queryClient);

  // console.log({ dehydratedState });

  return {
    props: {
      dehydratedState,
      lastUpdated,
      videoCount,
      channelCount,
    },
  };
}
