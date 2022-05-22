import Image from 'next/image';
import TimeAgo from 'react-timeago';
import englishStrings from 'react-timeago/lib/language-strings/en';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

const formatter = buildFormatter(englishStrings);

export default function VideoCard({ video }) {
  const { youtubeId, title, channel, thumbnail, publishedAt } = video;

  return (
    <div key={youtubeId} className='bg-slate-100 h-full border-slate-700'>
      <a href={`https://youtube.com/watch?v=${youtubeId}`}>
        <img src={thumbnail} alt={title} className='w-full' />
      </a>
      <div className='p-2'>
        <span className='font-semibold'>{channel.channelName}</span>: {title} (
        <TimeAgo date={publishedAt} formatter={formatter} />)
      </div>
    </div>
  );
}
