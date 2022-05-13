import fetch from 'node-fetch';
import pc from 'picocolors';

export const warn = (str) => console.log(`${pc.yellow('Warning')}: ${str}`);

export const error = (str) => console.error(`${pc.red('Warning')}: ${str}`);

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
