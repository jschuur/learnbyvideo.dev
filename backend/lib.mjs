import fetch from 'node-fetch';

import { error } from './util.mjs';

// Rebuild the static homepage on Vercel via on demand ISR
// eslint-disable-next-line import/prefer-default-export
export async function updateHomePage() {
  console.log('Updating production home page');

  try {
    const res = await fetch(`http://learnbyvideo.dev/api/update?secret=${process.env.REVALIDATE_SECRET_TOKEN}`);

    if (res.ok) {
      console.log(`Home page successfully updated`);
    } else {
      error(`Couldn't update home page`);
    }
  } catch ({ message }) {
    error(`Couldn't update home page: ${message}`);
  }
}
