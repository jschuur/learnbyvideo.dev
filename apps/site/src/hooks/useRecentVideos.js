import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getRecentVideos } from '../lib/data.js';

const videoGridSize = parseInt(process.env.NEXT_PUBLIC_VIDEO_GRID_COUNT, 10);

const useRecentVideos = () => {
  // grab the second page of data now, to avoid cold start related infinite scrolling delay
  const { data: secondPage } = useQuery({
    queryKey: ['prefetchSecondPage'],
    queryFn: () => getRecentVideos({ offset: videoGridSize }),
    staleTime: Infinity,
  });

  return useInfiniteQuery({
    queryKey: ['recentVideos'],
    queryFn: ({ pageParam }) =>
      pageParam === videoGridSize && secondPage
        ? secondPage
        : getRecentVideos({ offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextOffset,
    staleTime: Infinity,
  });
};

export default useRecentVideos;
