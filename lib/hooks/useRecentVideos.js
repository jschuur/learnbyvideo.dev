import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchRecentVideos } from '../request';

const videoGridSize = parseInt(process.env.NEXT_PUBLIC_VIDEO_GRID_COUNT, 10);

const useRecentVideos = () => {
  // grab the second page of data now, to avoid cold start related infinite scrolling delay
  const { data: secondPage } = useQuery(['prefetchSecondPage'], () => fetchRecentVideos({ pageParam: videoGridSize }), {
    staleTime: Infinity,
  });

  return useInfiniteQuery(
    ['recentVideos'],
    ({ pageParam }) => (pageParam === videoGridSize && secondPage ? secondPage : fetchRecentVideos({ pageParam })),
    {
      getNextPageParam: (lastPage) => lastPage.pageInfo.nextOffset,
      staleTime: Infinity,
    }
  );
};

export default useRecentVideos;
