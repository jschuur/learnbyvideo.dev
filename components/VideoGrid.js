import { flatMap, partition } from 'lodash-es';
import InfiniteScroll from 'react-infinite-scroller';
import { SpinnerInfinity } from 'spinners-react';

import VideoCard from './VideoCard';

import useRecentVideos from '../lib/hooks/useRecentVideos';

const sortVideoData = (data) => partition(flatMap(data.pages, 'videos'), { status: 'LIVE' }).flat();

function LoadingSpinner() {
  return (
    <div className='flex flex-col items-center justify-center p-2 mt-4'>
      <SpinnerInfinity
        size={50}
        thickness={80}
        speed={100}
        color='black'
        secondaryColor='lightgray'
      />
    </div>
  );
}

export default function VideoGrid() {
  const { data, fetchNextPage, hasNextPage, status, error } = useRecentVideos();

  if (!data) {
    console.warn('VideoGrid: no data (should have been prefetched at build time)');

    return <LoadingSpinner />;
  }

  return status === 'loading' ? (
    <div className='p-2 mt-4 text-center border border-black'>Loading...</div>
  ) : status === 'error' ? (
    <div className='p-2 mt-4 text-center border border-red-600'>Error: {error.message}</div>
  ) : (
    <InfiniteScroll
      pageStart={0}
      loadMore={fetchNextPage}
      hasMore={hasNextPage}
      loader={<LoadingSpinner key={0} />}
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
