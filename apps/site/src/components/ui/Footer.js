'use client';

import pluralize from 'pluralize';
import TimeAgo from 'react-timeago';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import englishStrings from 'react-timeago/lib/language-strings/en';

const formatter = buildFormatter(englishStrings);

export default function Footer({ videoCount, channelCount, lastUpdated }) {
  return (
    <div className='py-4 text-sm text-right text-slate-500'>
      <p>
        Tracking {Intl.NumberFormat('en-US').format(videoCount)}{' '}
        {pluralize('video', videoCount, false)} from a curated list of{' '}
        {Intl.NumberFormat('en-US').format(channelCount)}{' '}
        {pluralize('channel', channelCount, false)}
      </p>
      <p suppressHydrationWarning>
        Last updated: <TimeAgo date={lastUpdated} formatter={formatter} />. By{' '}
        <a className='text-blue-700' href='https://twitter.com/joostschuur/'>
          Joost Schuur
        </a>{' '}
        (
        <a className='text-blue-700' href='https://twitter.com/learnbyvideodev/'>
          @LearnByVideoDev
        </a>
        )
      </p>
    </div>
  );
}
