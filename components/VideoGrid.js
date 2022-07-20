import { flatMap, partition } from 'lodash-es';
import { useInfiniteQuery } from 'react-query';

import { fetchRecentVideos } from '../lib/request';

import VideoCard from './VideoCard';

const sortVideoData = (data) => partition(flatMap(data.pages, 'videos'), { status: 'LIVE' }).flat();

export default function VideoGrid({ initialVideoData }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error } = useInfiniteQuery(
    ['recentVideos'],
    fetchRecentVideos,
    {
      initialData: { pages: [initialVideoData] },
      getNextPageParam: (lastPage) => lastPage.pageInfo.nextOffset,
      staleTime: Infinity,
    }
  );

  return status === 'loading' ? (
    <div className="mt-4 p-2 text-center border-black border">Loading...</div>
  ) : status === 'error' ? (
    <div className="mt-4 p-2 text-center border-red-600 border">Error: {error.message}</div>
  ) : (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortVideoData(data).map((video) => (
          <div key={video.youtubeId}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
      <div
        onClick={() => fetchNextPage()}
        onKeyPress={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
        role="button"
        tabIndex={0}
        className="mt-4 p-2 text-center border-black border"
      >
        {' '}
        {isFetchingNextPage ? 'Loading more...' : 'Load More'}
      </div>
    </div>
  );
}
