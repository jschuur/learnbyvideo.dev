import Image from 'next/image';
import TimeAgo from 'react-timeago';
import englishStrings from 'react-timeago/lib/language-strings/en';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import VideoThumbnail from './youtube/VideoThumbnail';

import { youtubeDuration } from '../lib/util';

const formatter = buildFormatter(englishStrings);

export default function VideoCard({ video }) {
  const { youtubeId, title, channel, thumbnail, publishedAt, duration, type } = video;

  return (
    <div
      key={youtubeId}
      className='bg-slate-50 border-slate-700 text-xs md:text-sm flex flex-1 flex-col h-full gap-0'
    >
      <a href={`https://youtube.com/watch?v=${youtubeId}`}>
        <div className='inline-block relative w-full'>
          <VideoThumbnail youtubeId={youtubeId} alt={title} className='w-full' />
          <div
            className={`absolute ${
              type === 'SHORT' ? 'bg-red-500' : 'bg-black/80'
            } text-white font-roboto font-medium text-[12px] tracking-[0.5px] bottom-0 right-0 mx-[4px] my-[4px] px-[4px] py-[0px] rounded-sm`}
          >
            {type === 'SHORT' ? 'SHORT' : youtubeDuration(duration)}
          </div>
        </div>
      </a>
      <div className='p-2 md: flex-grow'>
        <span className='font-semibold'>{channel.channelName}</span>:{' '}
        <a href={`https://youtube.com/watch?v=${youtubeId}`}>{title}</a>
      </div>
      <div className='text-right text-xs font-thin text-slate-400 pb-2 pr-2'>
        <TimeAgo date={publishedAt} formatter={formatter} />
      </div>
    </div>
  );
}
