/* eslint-disable react/jsx-props-no-spreading */

import { Analytics } from '@vercel/analytics/react';
import { useState } from 'react';

import '../styles/globals.css';

import { Hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';

function MyApp({ Component, pageProps: { dehydratedState, ...remainingPageProps } }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<>
			<QueryClientProvider client={queryClient}>
				<Hydrate state={dehydratedState}>
					<Component {...remainingPageProps} />
				</Hydrate>
			</QueryClientProvider>
			<Analytics />
		</>
	);
}

export default MyApp;
