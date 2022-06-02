import VideoCard from './VideoCard';

export default function VideoGrid({ videos }) {
  return (
    <div>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {videos.map((video) => (
          <div key={video.youtubeId}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}
