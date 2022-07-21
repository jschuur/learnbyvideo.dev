import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchRecentVideos } from '../request';

const useRecentVideos = () =>
  useInfiniteQuery(['recentVideos'], fetchRecentVideos, {
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextOffset,
    staleTime: Infinity,
  });

export default useRecentVideos;
