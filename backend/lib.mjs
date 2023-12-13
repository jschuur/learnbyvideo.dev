import { VideoStatus } from '@prisma/client';
import { differenceBy } from 'lodash-es';
import fetch from 'node-fetch';
import pluralize from 'pluralize';

import { updateVideo } from './db.mjs';
import { error } from './util.mjs';
import { missingVideoStatus, videoUrl } from './youtube.mjs';

// Rebuild the static homepage on Vercel via on demand ISR
// eslint-disable-next-line import/prefer-default-export
export async function updateHomePage() {
  console.log('Updating production home page');

  try {
    const res = await fetch(`http://learnbyvideo.dev/api/update?secret=${process.env.REVALIDATE_SECRET_TOKEN}`);

    if (res.ok) {
      console.log('Home page successfully updated');
    } else {
      error(`Couldn't update home page`);
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
    `Identified ${pluralize('missing video', deletedVideos.length, true)}: ${deletedVideos
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
