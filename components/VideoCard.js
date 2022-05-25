import Image from 'next/image';
import TimeAgo from 'react-timeago';
import englishStrings from 'react-timeago/lib/language-strings/en';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import VideoThumbnail from './youtube/VideoThumbnail';

const formatter = buildFormatter(englishStrings);

export default function VideoCard({ video }) {
  const { youtubeId, title, channel, thumbnail, publishedAt } = video;

  return (
    <div
      key={youtubeId}
      className='bg-slate-100 border-slate-700 flex flex-1 flex-col h-full gap-0'
    >
      <a href={`https://youtube.com/watch?v=${youtubeId}`}>
        <VideoThumbnail youtubeId={youtubeId} alt={title} className='w-full' />
      </a>
      <div className='p-2 text-sm flex-grow'>
        <span className='font-semibold'>{channel.channelName}</span>:{' '}
        <a href={`https://youtube.com/watch?v=${youtubeId}`}>{title}</a>
      </div>
      <div className='text-right text-xs text-slate-400 pb-2 pr-2'>
        <TimeAgo date={publishedAt} formatter={formatter} />
      </div>
    </div>
  );
}
