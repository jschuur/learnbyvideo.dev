// Allow the .env file to override any config constant
const defaultValues = (defs) =>
  defs.reduce((acc, [name, value]) => ({ ...acc, [name]: process.env[name] || value }), {});

const config = {
  ...defaultValues([
    ['RSS_FEED_UPDATE_DELAY_MS', 100],
    ['SHORTS_CHECK_DELAY_MS', 1000],
    ['MISSING_VIDEO_STATUS_CHECK_DELAY_MS', 200],
    ['GRAPHQL_MAX_RECENT_VIDEOS', 240],
    ['GRAPHQL_DEFAULT_SEARCH_RESULTS_LIMIT', 96],
    ['GRAPHQL_DEFAULT_RECENT_VIDEOS_LIMIT', 24],
    ['GRAPHQL_MAX_SEARCH_RESULTS_LIMIT', 500],
    ['MAX_YOUTUBE_BATCH_SIZE', 50],
    ['MAX_VIDEO_UPDATE_COUNT', 5000],
    ['RECENT_VIDEOS_RECHECK_HOURS', 24],
    ['VIDEO_OVERDUE_MINUTES', 180],
  ]),

  taskQuotas: {
    all: 10000,
    crawl_channels: 2000,
    find_videos: 2000,
    update_videos: 5000,
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

  videoStatusHints: {
    PRIVATE: 'This is a private video',
    DELETED_ACCOUNT:
      'This video is no longer available because the uploader has closed their YouTube account',
    // cspell: disable-next-line
    UNAVAILABLE: `This video isn't available anymore`,
    REMOVED: 'This video has been removed by the uploader',
  },
};

export default config;
