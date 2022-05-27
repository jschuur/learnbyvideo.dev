import { chunk, merge } from 'lodash-es';
import fetch from 'node-fetch';
import { youtube } from '@googleapis/youtube';

import { addQuotaUsage } from './db.mjs';
import { debug } from './util.mjs';

import config from './config.mjs';

const Youtube = youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let quotaUsage = 0;

export const currentQuotaUsage = () => quotaUsage;
export const resetQuotaUsage = () => (quotaUsage = 0);

async function logQuotaUsage({ endpoint, parts, task }) {
  const quotaCost = parts
    .split(',')
    .reduce((acc, part) => acc + config.youTubeApiPartQuotas[part], 1);

  debug(`YouTube API quota used for ${endpoint}: ${quotaCost}`);

  await addQuotaUsage({ endpoint, parts, points: quotaCost, task });

  quotaUsage += quotaCost;
}

// Batch YouTube API requests into the appropriate # of calls based on how many IDs it takes
async function batchYouTubeRequest({ endpoint, ids, playlistIds, task, ...apiOptions }) {
  let idField = 'id';
  let batchSize = config.MAX_YOUTUBE_BATCH_SIZE;
  const [model, action] = endpoint.split('.');
  let response;

  // Only the playlists endpoint can't accept batches of IDs and uses a different field name
  if (playlistIds) {
    batchSize = 1;
    idField = 'playlistId';
    ids = playlistIds;
  }

  await logQuotaUsage({ endpoint, parts: apiOptions.part, task });

  // Loop through each batch of updates (wrap async map in Promise.all())
  return (
    await Promise.all(
      chunk(ids, batchSize).map(async (idChunk) => {
        apiOptions[idField] = idChunk.join(',');

        debug(`batchYouTubeRequest to ${endpoint}`, apiOptions);
        try {
          response = await Youtube[model][action](apiOptions);
        } catch (err) {
          throw Error(`YouTube API error calling ${endpoint} (${err.message})`);
        }

        return response.data.items;
      })
    )
  ).flat();
}

// Make a multi-page YouTube API request
async function paginatedYouTubeRequest({
  endpoint,
  maxPages = Number.MAX_SAFE_INTEGER,
  task,
  ...apiOptions
}) {
  const [model, action] = endpoint.split('.');
  let items = [];
  let response;
  let pageToken,
    pageCount = 0;

  do {
    if (pageToken) merge(apiOptions, { pageToken });

    debug(`paginatedYouTubeRequest to ${endpoint} ${JSON.stringify(apiOptions)}`);
    try {
      response = await Youtube[model][action](apiOptions);
    } catch ({ message }) {
      throw Error(`YouTube API error calling ${endpoint} (${message})`);
    }

    logQuotaUsage({ endpoint, parts: apiOptions.part, task });

    items.push(...response.data.items);
    pageToken = response.data.nextPageToken;
    pageCount++;
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