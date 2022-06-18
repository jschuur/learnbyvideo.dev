import pluralize from 'pluralize';

// add comma to number

export default function Footer({ videoCount, channelCount, lastUpdated }) {
  return (
    <div className="text-right text-sm text-slate-500 py-4">
      <p>
        Tracking {Intl.NumberFormat('en-US').format(videoCount)} {pluralize('video', videoCount, false)} from{' '}
        {Intl.NumberFormat('en-US').format(channelCount)} {pluralize('channel', channelCount, false)}
      </p>
      Last updated: {lastUpdated}.
      <a className="text-blue-700" href="https://twitter.com/learnbyvideodev/">
        @LearnByVideoDev
      </a>
    </div>
  );
}
