import { partition } from 'lodash-es';

import VideoCard from './VideoCard';

export default function VideoGrid({ videos }) {
  const sortedVideos = partition(videos, { status: 'LIVE' }).flat();

  return (
    <div>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {sortedVideos.map((video) => (
          <div key={video.youtubeId}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}
