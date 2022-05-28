import fetch from 'node-fetch';
import Parser from 'rss-parser';
import { youtube } from '@googleapis/youtube';

import { ChannelStatus, VideoStatus } from '@prisma/client';

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:group', 'media'],
      ['yt:videoId', 'videoId'],
      ['yt:channelId', 'channelId'],
    ],
  },
});

const Youtube = youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// https://www.youtube.com/feeds/videos.xml?channel_id=THE_CHANNEL_ID_HERE
export async function getRecentVideosFromRSS(channel) {
  const { youtubeId, channelName } = channel;

  console.log(`Getting recent videos via RSS for channel ${channelName}`);

  try {
    const feed = await rssParser.parseURL(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeId}`
    );

    return feed.items.map((item) => extractVideoInfo({ item }));
  } catch ({ message }) {
    console.log(`Couldn't get recent videos for channel ${channelName}: ${message}`);
  }
}

export function extractVideoInfo({ item, id, snippet, statistics, contentDetails }) {
  const itemViews = item?.media?.['media:community']?.[0]?.['media:statistics']?.[0]?.['$']?.views;
  const itemLikes = item?.media?.['media:community']?.[0]?.['media:starRating']?.[0]?.['$']?.count;

  return {
    youtubeId: id || item?.videoId,
    title: snippet?.title || item?.title,
    description: snippet?.description || item?.media['media:description'][0],
    publishedAt: snippet?.publishedAt || item.pubDate,
    duration: contentDetails?.duration,
    durationSeconds: contentDetails?.duration
      ? youtubeDuration(contentDetails.duration).toSeconds
      : undefined,
    youtubeTags: snippet?.tags || [],
    language: snippet?.defaultAudioLanguage || undefined,
    viewCount: statistics?.viewCount
      ? parseInt(statistics.viewCount, 10)
      : itemViews
      ? parseInt(itemViews, 10)
      : undefined,
    likeCount: statistics?.likeCount
      ? parseInt(statistics.likeCount, 10)
      : itemLikes
      ? parseInt(itemLikes, 10)
      : undefined,
    commentCount: statistics?.commentCount ? parseInt(statistics.commentCount, 10) : undefined,
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

export async function getChannelInfo(youtubeId) {
  const res = await Youtube.channels.list({
    part: 'snippet,statistics',
    id: youtubeId,
  });

  return { youtubeId, ...extractChannelInfo(res.data.items[0]) };
}

export const getVideoInfo = (youtubeId) =>
  Youtube.videos.list({
    part: 'snippet',
    id: youtubeId,
  });

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
    console.error(`Error validating new video for Short, ID ${youtubeId} (${title}): ${message}`);

    return false;
  }
}

export const videoStatus = ({ channel, video }) =>
  channel.status === ChannelStatus.MODERATED ? VideoStatus.MODERATED : VideoStatus.PUBLISHED;

// Swap out 'UC' at the start of a youTube ID to get the upload playlist ID
export const uploadPlaylistIdFromChannelId = (youtubeId) => 'UU' + youtubeId.slice(2);

// Turn Youtube's duration format like 'PT11M32S' into something more usable
export function youtubeDuration(str) {
  let toSeconds = -1,
    format = '-';
  const pad = (num) => num.toString().padStart(2, '0');

  const matches = str.match(/PT((\d+)H)?((\d+)M)?((\d+)S)?/);

  if (matches) {
    const [, , hours = 0, , minutes = 0, , seconds = 0] = matches;
    toSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

    format = hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  }

  return {
    toSeconds,
    format,
  };
}
