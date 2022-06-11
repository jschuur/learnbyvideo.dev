// Allow the .env file to override any config constant
const defaultValues = (defs) =>
  defs.reduce((acc, [name, value]) => ({ ...acc, [name]: process.env[name] || value }), {});

const config = {
  ...defaultValues([
    ['RSS_FEED_UPDATE_DELAY_MS', 100],
    ['SHORTS_CHECK_DELAY_MS', 1000],
    ['GRAPHQL_MAX_RECENT_VIDEOS', 96],
    ['GRAPHQL_DEFAULT_SEARCH_RESULTS_LIMIT', 96],
    ['GRAPHQL_MAX_SEARCH_RESULTS_LIMIT', 500],
    ['MAX_YOUTUBE_BATCH_SIZE', 50],
  ]),

  taskQuotas: {
    all: 10000,
    crawl_channels: 2000,
    update_videos: 1000,
    update_videos_full: 1000,
    update_channels: 500,
    add_channel: 2000,
  },

  youTubeApiPartQuotas: {
    auditDetails: 4,
    brandingSettings: 2,
    contentDetails: 2,
    contentOwnerDetails: 2,
    fileDetails: 1,
    id: 0,
    liveStreamingDetails: 2,
    localizations: 2,
    player: 0,
    processingDetails: 1,
    recordingDetails: 2,
    snippet: 2,
    statistics: 2,
    status: 2,
    suggestions: 1,
    topicDetails: 2,
  },
};

export default config;
