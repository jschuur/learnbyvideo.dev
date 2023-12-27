/* eslint-disable react/jsx-props-no-spreading */

import { HydrationBoundary, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Analytics } from '@vercel/analytics/react';
import { useState } from 'react';

import '../styles/globals.css';

function MyApp({ Component, pageProps: { dehydratedState, ...remainingPageProps } }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Component {...remainingPageProps} />
        </HydrationBoundary>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      <Analytics />
    </>
  );
}

export default MyApp;
