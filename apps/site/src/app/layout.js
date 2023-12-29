import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import GoogleAnalytics from '../components/GoogleAnalytics';
import Providers from '../components/Providers';
import Footer from '../components/ui/Footer';
import Header from '../components/ui/Header';

import { getRecentVideos, getSiteData } from '../lib/data';

export default async function RootLayout({ children }) {
  const { videoCount, channelCount } = await getSiteData();
  const recentVideos = await getRecentVideos();

  const lastUpdated = Math.max(...recentVideos.videos.map((v) => new Date(v.updatedAt).getTime()));

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['recentVideos'],
    queryFn: () => recentVideos,
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <html lang='en'>
      <body className='bg-blue-50'>
        <Providers>
          <HydrationBoundary state={dehydratedState}>
            <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />

            <div className='container px-10 mx-auto'>
              <Header />
              {children}
              <Footer
                videoCount={videoCount}
                channelCount={channelCount}
                lastUpdated={lastUpdated}
              />
            </div>
          </HydrationBoundary>
        </Providers>
      </body>
    </html>
  );
}
