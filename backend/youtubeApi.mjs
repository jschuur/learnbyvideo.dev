import { youtube } from '@googleapis/youtube';
import { chunk, merge } from 'lodash-es';

import { debug } from './util.mjs';

import config from './config.mjs';

const Youtube = youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Batch YouTube API requests into the appropriate # of calls based on how many IDs it takes
async function batchYouTubeRequest(options) {
  const { endpoint, ids, playlistIds, quotaTracker, ...apiOptions } = options;
  let idField = 'id';
  let videoIds = ids;
  let batchSize = config.MAX_YOUTUBE_BATCH_SIZE;
  const [model, action] = endpoint.split('.');
  let response;
  const results = [];

  // Only the playlists endpoint can't accept batches of IDs and uses a different field name
  if (playlistIds) {
    batchSize = 1;
    idField = 'playlistId';
    videoIds = playlistIds;
  }

  // Loop through each batch of updates
  for (const idChunk of chunk(videoIds, batchSize)) {
    apiOptions[idField] = idChunk.join(',');

    debug(`batchYouTubeRequest to ${endpoint} ${JSON.stringify(apiOptions, null, 2)}`);

    try {
      response = await Youtube[model][action](apiOptions);
    } catch (err) {
      throw Error(`YouTube API error calling ${endpoint} (${err.message})`);
    } finally {
      await quotaTracker.logUsage({ endpoint, parts: apiOptions.part });
    }

    results.push(...response.data.items);
  }

  return results;
}

// Make a multi-page YouTube API request
async function paginatedYouTubeRequest({
  endpoint,
  maxPages = Number.MAX_SAFE_INTEGER,
  quotaTracker,
  ...apiOptions
}) {
  const [model, action] = endpoint.split('.');
  const items = [];
  let response;
  let pageToken;
  let pageCount = 0;

  do {
    if (pageToken) merge(apiOptions, { pageToken });

    debug(`paginatedYouTubeRequest to ${endpoint} ${JSON.stringify(apiOptions)}`);

    try {
      // @googleapis/youtube can miss API results if you make parallel calls
      response = await Youtube[model][action](apiOptions);
    } catch ({ message }) {
      throw Error(
        `YouTube API error calling ${endpoint} during ${quotaTracker?.task} (${message})`
      );
    }

    quotaTracker.logUsage({ endpoint, parts: apiOptions.part });

    items.push(...response.data.items);
    pageToken = response.data.nextPageToken;
    pageCount += 1;
  } while (pageToken && pageCount < maxPages);

  return items;
}

// Get info about one more more videos
// https://developers.google.com/youtube/v3/docs/videos/list
export async function youTubeVideosList({ part = 'snippet', ...options }) {
  return batchYouTubeRequest({
    endpoint: 'videos.list',
    part,
    ...options,
  });
}

// Get info about one more more channels
// https://developers.google.com/youtube/v3/docs/channels/list
export async function youTubeChannelsList({ part = 'snippet', ...options }) {
  return batchYouTubeRequest({
    endpoint: 'channels.list',
    part,
    ...options,
  });
}

// Get info about a playlist (including channel uploads)
// https://developers.google.com/youtube/v3/docs/playlistItems/list
export async function youTubePlaylistItems({ part = 'snippet', paginate = true, ...options }) {
  return paginate
    ? paginatedYouTubeRequest({
        endpoint: 'playlistItems.list',
        maxResults: 50,
        part,
        ...options,
      })
    : batchYouTubeRequest({
        endpoint: 'playlistItems.list',
        maxResults: 50,
        part,
        ...options,
      });
}
