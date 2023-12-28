'use client';

/* eslint-disable react/jsx-props-no-spreading */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import { Analytics } from '@vercel/analytics/react';
import { useState } from 'react';

import '@/styles/globals.css';

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

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
      {<ReactQueryDevtools initialIsOpen={true} />}
      <Analytics />
    </QueryClientProvider>
  );
}
