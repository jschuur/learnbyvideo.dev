import { partition } from 'lodash-es';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import VideoCard from './VideoCard';

import { fetchRecentVideos } from '../lib/request';

const sortVideos = (videos) => partition(videos, { status: 'LIVE' }).flat();

export default function VideoGrid({ initialVideoData }) {
  const [sortedVideos, setSortedVideos] = useState(sortVideos(initialVideoData.videos));
  const [nextPage, setNextPage] = useState(initialVideoData.pageInfo.nextPage);

  const { data } = useQuery(['videos'], fetchRecentVideos, { initialData: initialVideoData, staleTime: Infinity });

  const loadNextPage = async () => {
    const { videos, pageInfo } = await fetchRecentVideos(nextPage);
    setNextPage(pageInfo.nextPage);
    setSortedVideos((v) => [...v, ...videos]);
  };

  useEffect(() => {
    setSortedVideos(sortVideos(data.videos));
    setNextPage(data.pageInfo.nextPage);
  }, [data]);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedVideos.map((video) => (
          <div key={video.youtubeId}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
      <div
        onClick={loadNextPage}
        onKeyPress={loadNextPage}
        role="button"
        tabIndex={0}
        className="mt-4 p-2 text-center border-black border"
      >
        {' '}
        Load More
      </div>
    </div>
  );
}
