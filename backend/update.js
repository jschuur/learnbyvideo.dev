import { getActiveChannels, saveVideos } from './db.js';
import { getRecentVideosFromRSS } from './lib.js';

(async () => {
  const channels = await getActiveChannels();

  for (const channel of channels) {
    const videos = await getRecentVideosFromRSS(channel);

    await saveVideos({ videos, channel });
  }
})();
