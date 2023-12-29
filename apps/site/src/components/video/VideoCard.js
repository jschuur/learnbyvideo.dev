'use client';

import TimeAgo from 'react-timeago';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';
import englishStrings from 'react-timeago/lib/language-strings/en';

import VideoCardOverlay from './VideoCardOverlay';
import VideoThumbnail from './VideoThumbnail';

import { shortDateTime } from '../../lib/util';

const formatter = buildFormatter(englishStrings);

export default function VideoCard({ video }) {
  const {
    youtubeId,
    title,
    channel,
    duration,
    publishedAt,
    scheduledStartTime,
    actualStartTime,
    type,
    status,
  } = video;

  // Format time string based on video type
  const timeText = actualStartTime ? (
    <>
      {status === 'LIVE' ? (duration === 'P0D' ? 'started streaming' : 'premiered') : 'streamed'}{' '}
      <TimeAgo date={actualStartTime} formatter={formatter} />
    </>
  ) : scheduledStartTime ? (
    <>scheduled for {shortDateTime(scheduledStartTime)}</>
  ) : (
    <TimeAgo date={publishedAt} formatter={formatter} />
  );

  return (
    <div
      key={youtubeId}
      className={`${
        channel.type === 'BRAND' ? 'bg-blue-200' : 'bg-slate-50'
      } border-slate-700 text-xs md:text-sm flex flex-1 flex-col h-full gap-0`}
    >
      <a href={`https://youtube.com/watch?v=${youtubeId}`}>
        <div className='relative inline-block w-full'>
          <VideoThumbnail youtubeId={youtubeId} alt={title} className='block' />
          <VideoCardOverlay duration={duration} type={type} status={status} />
        </div>
      </a>
      <div className='flex-grow p-2 md:p-1'>
        <span className='font-semibold'>{channel.channelName}</span>:{' '}
        <a href={`https://youtube.com/watch?v=${youtubeId}`}>{title}</a>
      </div>
      <div
        suppressHydrationWarning
        className='pb-2 pr-2 text-xs font-thin text-right text-slate-700'
      >
        {timeText}
      </div>
    </div>
  );
}
