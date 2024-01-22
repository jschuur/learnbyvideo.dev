import { VideoStatus } from 'database';
import { differenceBy } from 'lodash-es';
import fetch from 'node-fetch';
import pluralize from 'pluralize';

import { updateVideo } from './db.js';
import { error } from './util.js';
import { missingVideoStatus, videoUrl } from './youtube.js';

// Rebuild the static homepage on Vercel via on demand ISR
// eslint-disable-next-line import/prefer-default-export
export async function updateHomePage(updateApiUrl) {
  try {
    console.log(`\nUpdating production home page via ${updateApiUrl} ...`);

    const res = await fetch(`${updateApiUrl}?secret=${process.env.REVALIDATE_SECRET_TOKEN}`);

    if (res.ok) {
      console.log('Home page successfully updated');
    } else {
      const body = await res.json();

      error(`Couldn't update home page: ${body?.message}`);
    }
  } catch ({ message }) {
    error(`Couldn't update home page: ${message}`);
  }
}

// Scrape contents of video page to discern what happened to missing videos
export async function checkForDeletedVideos({ originalVideos, latestVideos }) {
  // Get the difference between the videos we checked from the DB and what the API returned
  const deletedVideos = differenceBy(originalVideos, latestVideos, 'youtubeId');

  if (deletedVideos?.length === 0) return;

  console.log(
    `\nIdentified ${pluralize('missing video', deletedVideos.length, true)}: ${deletedVideos
      .map((video) => video.youtubeId)
      .join(', ')}`
  );

  for (const video of deletedVideos) {
    const { youtubeId } = video;

    const deletedStatus = await missingVideoStatus(youtubeId);
    const status = ['REMOVED', 'UNAVAILABLE', 'DELETED_ACCOUNT'].includes(deletedStatus)
      ? VideoStatus.DELETED
      : deletedStatus === 'PRIVATE'
      ? VideoStatus.PRIVATE
      : VideoStatus.UNKNOWN;

    console.log(`${status}: ${videoUrl(youtubeId)}`);

    await updateVideo({ youtubeId, status });
  }
}
