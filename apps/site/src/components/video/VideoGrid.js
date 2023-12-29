'use client';

import { flatMap, partition } from 'lodash-es';
import InfiniteScroll from 'react-infinite-scroller';

import Loading from '../ui/Loading';
import VideoCard from './VideoCard';

import useRecentVideos from '../../hooks/useRecentVideos';

const sortVideoData = (data) => partition(flatMap(data.pages, 'videos'), { status: 'LIVE' }).flat();

export default function VideoGrid() {
  const { data, fetchNextPage, hasNextPage, status, error } = useRecentVideos();

  if (!data) {
    console.warn('VideoGrid: no data (should have been prefetched at build time)');

    return <Loading />;
  }

  return status === 'loading' ? (
    <Loading />
  ) : status === 'error' ? (
    <div className='p-2 mt-4 text-center border border-red-600'>Error: {error.message}</div>
  ) : (
    <InfiniteScroll
      pageStart={0}
      loadMore={fetchNextPage}
      hasMore={hasNextPage}
      loader={<Loading key={0} />}
    >
      <div className='grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4'>
        {sortVideoData(data).map((video) => (
          <div key={video.youtubeId}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </InfiniteScroll>
  );
}
