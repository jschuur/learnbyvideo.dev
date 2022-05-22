import { gql } from '@apollo/client';
import { contextResolver } from '../graphql/context.js';
import { createStaticApolloClient } from '../lib/apollo-client-static.js';

import Footer from '../components/Footer.js';
import VideoGrid from '../components/VideoGrid.js';

export default function HomePage({ videos }) {
  return (
    <div className='container mx-auto px-10'>
      <VideoGrid videos={videos} />

      <Footer />
    </div>
  );
}

export async function getStaticProps(context) {
  await contextResolver(context);

  const client = createStaticApolloClient(context);
  const response = await client.query({
    query: gql`
      query Query {
        recentVideos {
          title
          youtubeId
          publishedAt
          thumbnail
          channel {
            channelName
          }
        }
      }
    `,
  });

  return {
    props: {
      videos: JSON.parse(JSON.stringify(response.data.recentVideos)),
    },
  };
}
