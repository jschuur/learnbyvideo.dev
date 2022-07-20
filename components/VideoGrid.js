import { flatMap, partition } from 'lodash-es';
import InfiniteScroll from 'react-infinite-scroller';
import { useInfiniteQuery } from 'react-query';

import { fetchRecentVideos } from '../lib/request';

import VideoCard from './VideoCard';

const sortVideoData = (data) => partition(flatMap(data.pages, 'videos'), { status: 'LIVE' }).flat();

export default function VideoGrid({ initialVideoData }) {
  const { data, fetchNextPage, hasNextPage, status, error } = useInfiniteQuery(['recentVideos'], fetchRecentVideos, {
    initialData: { pages: [initialVideoData] },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextOffset,
    staleTime: Infinity,
  });

  return status === 'loading' ? (
    <div className="mt-4 p-2 text-center border-black border">Loading...</div>
  ) : status === 'error' ? (
    <div className="mt-4 p-2 text-center border-red-600 border">Error: {error.message}</div>
  ) : (
    <InfiniteScroll
      pageStart={0}
      loadMore={fetchNextPage}
      hasMore={hasNextPage}
      loader={
        <div className="mt-4 p-2 text-center border-black border" key={0}>
          Getting more recent videos...
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortVideoData(data).map((video) => (
          <div key={video.youtubeId}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </InfiniteScroll>
  );
}
