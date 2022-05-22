import VideoCard from './VideoCard';

export default function VideoGrid({ videos }) {
  return (
    <div>
      <h1 className='text-center text-3xl py-4'>Recent Videos</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {videos.map((video) => (
          <div key={video.youtubeId}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}
