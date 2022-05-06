import Parser from 'rss-parser';
import { youtube } from '@googleapis/youtube';

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

  const feed = await rssParser.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeId}`
  );

  return feed.items.map((item) => ({
    title: item.title,
    youtubeId: item.videoId,
    // channelId: ,
    description: item.media['media:description'][0],
    thumbnail: item.media['media:thumbnail'][0]['$'].url,
    publishedAt: item.pubDate,
    starRating: item.media['media:community'][0]['media:starRating'][0]['$'],
    views: parseInt(item.media['media:community'][0]['media:statistics'][0]['$'].views, 10),
  }));
}

export async function getChannelInfo(youtubeId) {
  const res = await Youtube.channels.list({
    part: 'snippet,statistics',
    id: youtubeId,
  });

  const snippet = res.data.items[0].snippet;

  return {
    youtubeId,
    channelName: snippet.title,
    description: snippet.description,
    customUrl: snippet.customUrl,
    country: snippet.country,
    publishedAt: snippet.publishedAt,

    thumbnail: snippet.thumbnails.default.url,
    thumbnailMedium: snippet.thumbnails.medium.url,
    thumbnailHigh: snippet.thumbnails.high.url,

    statistics: res.data.items[0].statistics,
  };
}
