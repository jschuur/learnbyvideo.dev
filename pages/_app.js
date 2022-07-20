/* eslint-disable react/jsx-props-no-spreading */

import { useState } from 'react';

import '../styles/globals.css';

import { Hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';

function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());
  // eslint-disable-next-line no-eval
  const deserializedDehydratedState = eval(`(${pageProps.dehydratedState})`);

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={deserializedDehydratedState}>
        <Component {...pageProps} />
      </Hydrate>
    </QueryClientProvider>
  );
}

export default MyApp;
