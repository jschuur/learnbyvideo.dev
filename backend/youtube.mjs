import dateFnsTz from 'date-fns-tz';
const { formatInTimeZone } = dateFnsTz;
import { map, keyBy, uniqBy } from 'lodash-es';
import fetch from 'node-fetch';
import pluralize from 'pluralize';
import Parser from 'rss-parser';

import { ChannelStatus, VideoStatus } from '@prisma/client';

import { youTubeVideosList, youTubePlaylistItems } from './youtubeApi.mjs';
import { warn, error } from './util.mjs';

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:group', 'media'],
      ['yt:videoId', 'youtubeId'],
      ['yt:channelId', 'channelId'],
    ],
  },
});

// Use the YouTube channel RSS feed to get recent videos
export async function getRecentVideosFromRSS(channel) {
  const { youtubeId, channelName } = channel;

  console.log(`Getting recent videos via RSS for channel ${channelName}...`);

  try {
    const feed = await rssParser.parseURL(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeId}`
    );

    return feed.items.map((item) => ({ ...item, channel }));
  } catch ({ message }) {
    console.log(`Couldn't get recent videos for channel ${channelName}: ${message}`);
  }
}

export function extractVideoInfo({ channel, video = {} }) {
  const { id, snippet, statistics, contentDetails, liveStreamingDetails } = video;

  if (!video) return {};

  if (channel && video.channel)
    warn(`Video channel already set in extractVideoInfo. Overriding (id: ${id})`);
  if (!channel && !video.channel) warn(`No video channel in extractVideoInfo (id: ${id})`);

  return {
    youtubeId: id,
    channel: channel || video.channel,
    title: snippet?.title,
    description: snippet?.description,
    publishedAt: snippet?.publishedAt,
    duration: contentDetails?.duration,
    durationSeconds: contentDetails?.duration
      ? youtubeDuration(contentDetails.duration).toSeconds
      : undefined,
    youtubeTags: snippet?.tags || [],
    language: snippet?.defaultAudioLanguage || undefined,
    viewCount: statistics?.viewCount ? parseInt(statistics.viewCount, 10) : undefined,
    likeCount: statistics?.likeCount ? parseInt(statistics.likeCount, 10) : undefined,
    commentCount: statistics?.commentCount ? parseInt(statistics.commentCount, 10) : undefined,
    scheduledStartTime: liveStreamingDetails?.scheduledStartTime,
    actualStartTime: liveStreamingDetails?.actualStartTime,
    actualEndTime: liveStreamingDetails?.actualEndTime,
    status: videoStatus({ channel, video, snippet }),
  };
}

export function extractChannelInfo({ id, snippet, statistics }) {
  return {
    youtubeId: id,
    channelName: snippet.title,
    description: snippet.description,
    customUrl: snippet.customUrl,
    country: snippet.country,
    publishedAt: snippet.publishedAt,
    thumbnail: snippet.thumbnails.default.url,
    thumbnailMedium: snippet.thumbnails.medium.url,
    thumbnailHigh: snippet.thumbnails.high.url,
    viewCount: statistics.viewCount ? parseInt(statistics.viewCount, 10) : undefined,
    subscriberCount: statistics.subscriberCount
      ? parseInt(statistics.subscriberCount, 10)
      : undefined,
    hiddenSubscriberCount: statistics.hiddenSubscriberCount || false,
    videoCount: statistics.videoCount ? parseInt(statistics.videoCount, 10) : undefined,
  };
}

export async function isShort({ youtubeId, title, publishedAt }) {
  const shortsUrl = `https://www.youtube.com/shorts/${youtubeId}`;

  // Many Shorts used this hashtag
  if (title.toLowerCase().includes('#shorts')) return true;

  // Launch date for Shorts
  if (publishedAt < '2021-09-01') return false;

  try {
    const res = await fetch(shortsUrl, { method: 'head' });

    return res?.url?.startsWith(shortsUrl);
  } catch ({ message }) {
    error(`Couldn't validating new video for Short, ID ${youtubeId} (${title}): ${message}`);

    return false;
  }
}

export function videoStatus({ channel, video, snippet }) {
  // Keep some video statuses, as they are set elsewhere
  if (
    video?.status &&
    [
      VideoStatus.MODERATED,
      VideoStatus.DELETED,
      VideoStatus.HIDDEN,
      videoStatus.PUBLISHED,
    ].includes(video.status)
  )
    return video.status;

  if (channel?.status === ChannelStatus.MODERATED) return VideoStatus.MODERATED;
  if (channel?.status === ChannelStatus.HIDDEN) return VideoStatus.HIDDEN;
  if (snippet?.liveBroadcastContent === 'upcoming') return VideoStatus.UPCOMING;
  if (snippet?.liveBroadcastContent === 'live') return VideoStatus.LIVE;

  return VideoStatus.PUBLISHED;
}

// Swap out 'UC' at the start of a youTube ID to get the upload playlist ID
export const uploadPlaylistIdFromChannelId = (youtubeId) => 'UU' + youtubeId.slice(2);

// Turn Youtube's duration format like 'PT11M32S' into something more usable
export function youtubeDuration(str) {
  let toSeconds = -1,
    format = '-';
  const pad = (num) => num.toString().padStart(2, '0');

  const matches = str.match(/P((\d+)D)?T((\d+)H)?((\d+)M)?((\d+)S)?/);

  if (matches) {
    const [, , days = 0, , hours = 0, , minutes = 0, , seconds = 0] = matches;
    toSeconds =
      parseInt(days) * 86400 + parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

    format = days
      ? `${days}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : hours
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  }

  return {
    toSeconds,
    format,
  };
}

// YouTube API quota resets at midnight PDT
export const youtubeQuotaDate = (date) =>
  formatInTimeZone(date || new Date(), 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss');

// Use the YouTube API to get a channel's entire history of videos
export async function crawlChannel({ channel, quotaTracker }) {
  console.log(`Crawling video archive for ${channel.channelName}...`);

  // Get all the videos from a channel from its uploads playlist
  const playlistItems = await youTubePlaylistItems({
    playlistId: uploadPlaylistIdFromChannelId(channel.youtubeId),
    part: 'contentDetails',
    quotaTracker,
  });

  // Then get all the video details for each video
  if (playlistItems?.length) {
    console.log(`  Found ${playlistItems.length} videos for ${channel.channelName}`);

    const videoData = await youTubeVideosList({
      part: 'snippet,statistics,contentDetails',
      ids: playlistItems.map((item) => item.contentDetails.videoId),
      quotaTracker,
    });

    return videoData.map((video) => extractVideoInfo({ video, channel }));
  } else {
    warn(`No videos found for ${channel.channelName}`);

    return [];
  }
}

// Gets updates for batches of videos in a single API request
export async function getVideoDetails({ videos, quotaTracker, part = 'snippet,statistics' }) {
  if (!videos?.length) return [];

  const uniqueVideos = uniqBy(videos.flat(), 'youtubeId');
  if (!uniqueVideos?.length) return [];

  const channelLookup = uniqueVideos.reduce(
    (acc, video) => ({ ...acc, [video.youtubeId]: video.channel }),
    {}
  );

  console.log(`Getting video details for ${pluralize('video', uniqueVideos.length, true)}...`);

  const videoData = await youTubeVideosList({
    part,
    ids: map(uniqueVideos, 'youtubeId'),
    quotaTracker,
  });

  // Also add the full channel back in, since that didn't come from the YouTube API
  const videoLookup = keyBy(
    videoData.map((video) => extractVideoInfo({ video, channel: channelLookup[video.id] })),
    'youtubeId'
  );

  // Return as an array or array of arrays, depending on the way called
  return videos.map((entry) =>
    Array.isArray(entry)
      ? entry.map((video) => videoLookup[video.youtubeId])
      : videoLookup[entry.youtubeId]
  );
}