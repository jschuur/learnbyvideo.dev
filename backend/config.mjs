const config = {
  RSS_FEED_UPDATE_DELAY_MS: 100,
  SHORTS_CHECK_DELAY_MS: 1000,
  GRAPHQL_MAX_RECENT_VIDEOS: 96,
  MAX_YOUTUBE_BATCH_SIZE: 50,
  MAX_CRAWLER_DAILY_QUOTA: 8000,

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
