import { flatMap, partition } from 'lodash-es';
import InfiniteScroll from 'react-infinite-scroller';
import { SpinnerInfinity } from 'spinners-react';

import VideoCard from './VideoCard';

import useRecentVideos from '../lib/hooks/useRecentVideos';

const sortVideoData = (data) => partition(flatMap(data.pages, 'videos'), { status: 'LIVE' }).flat();

function LoadingSpinner() {
	return (
		<div className="mt-4 p-2 flex flex-col justify-center items-center">
			<SpinnerInfinity size={50} thickness={80} speed={100} color="black" secondaryColor="lightgray" />
		</div>
	);
}

export default function VideoGrid() {
	const { data, fetchNextPage, hasNextPage, status, error } = useRecentVideos();

	return status === 'loading' ? (
		<div className="mt-4 p-2 text-center border-black border">Loading...</div>
	) : status === 'error' ? (
		<div className="mt-4 p-2 text-center border-red-600 border">Error: {error.message}</div>
	) : (
		<InfiniteScroll pageStart={0} loadMore={fetchNextPage} hasMore={hasNextPage} loader={<LoadingSpinner key={0} />}>
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
