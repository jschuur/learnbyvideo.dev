import { gql } from '@apollo/client';
import { sortBy } from 'lodash-es';

import { contextResolver } from '../graphql/context.js';
import { createStaticApolloClient } from '../lib/apollo-client-static.js';

import Footer from '../components/Footer.js';
import VideoGrid from '../components/VideoGrid.js';

export default function HomePage({ videos, videoCount, channelCount, lastUpdated }) {
  return (
    <div className='container mx-auto px-10'>
      <h1 className='font-header text-center text-3xl py-8'>Recent Development Videos</h1>
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
          youtubeId
          publishedAt
          createdAt
          thumbnail
          channel {
            channelName
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
